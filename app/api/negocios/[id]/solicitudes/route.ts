import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener solicitudes (carrito) con match >= 70% para productos del negocio
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que el negocio pertenece al usuario
    const { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .select("id")
      .eq("id", id)
      .eq("propietario_id", user.id)
      .single();

    if (negocioError || !negocio) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Obtener productos del negocio con embeddings del catálogo maestro
    const { data: productosNegocio, error: productosError } = await supabase
      .from("negocio_catalogo")
      .select(`
        id,
        producto_id,
        precio_negocio,
        stock_disponible,
        catalogo_maestro:producto_id (
          id,
          nombre,
          descripcion,
          embedding
        )
      `)
      .eq("negocio_id", id)
      .eq("activo", true)
      .gt("stock_disponible", 0);

    if (productosError) {
      console.error("Error obteniendo productos del negocio:", productosError);
      return NextResponse.json(
        { error: "Error obteniendo productos" },
        { status: 500 }
      );
    }

    if (!productosNegocio || productosNegocio.length === 0) {
      return NextResponse.json({
        success: true,
        solicitudes: [],
        message: "El negocio no tiene productos activos con stock",
      });
    }

    // Obtener solicitudes pendientes o con ofertas
    const { data: solicitudes, error: solicitudesError } = await supabase
      .from("carrito")
      .select("*")
      .in("estado", ["pendiente", "con_ofertas"])
      .order("created_at", { ascending: false });

    if (solicitudesError) {
      console.error("Error obteniendo solicitudes:", solicitudesError);
      return NextResponse.json(
        { error: "Error obteniendo solicitudes" },
        { status: 500 }
      );
    }

    console.log("Solicitudes encontradas:", solicitudes?.length || 0);
    if (solicitudes && solicitudes.length > 0) {
      console.log("Ejemplo de solicitud:", JSON.stringify(solicitudes[0], null, 2));
    }

    if (!solicitudes || solicitudes.length === 0) {
      return NextResponse.json({
        success: true,
        solicitudes: [],
        message: "No hay solicitudes disponibles",
      });
    }

    // Calcular similitud entre solicitudes y productos del negocio
    const solicitudesConMatch: Array<{
      id: string;
      producto_descripcion: string;
      cantidad: number;
      embedding: number[];
      estado: string;
      created_at: string;
      user_id: string;
      usuarios: { id: string; nombre_completo: string | null; email: string } | null;
      matches: Array<{
        negocio_catalogo_id: string;
        producto_id: string;
        producto_nombre: string;
        producto_descripcion: string;
        precio_unitario: number;
        stock_disponible: number;
        similitud: number;
      }>;
      oferta_enviada: boolean;
      oferta_estado: string | null;
    }> = [];

    console.log(`Procesando ${solicitudes.length} solicitudes contra ${productosNegocio.length} productos del negocio`);

    for (const solicitud of solicitudes) {
      const matches: Array<{
        negocio_catalogo_id: string;
        producto_id: string;
        producto_nombre: string;
        producto_descripcion: string;
        precio_unitario: number;
        stock_disponible: number;
        similitud: number;
      }> = [];

      for (const productoNegocio of productosNegocio) {
        // biome-ignore lint/suspicious/noExplicitAny: Supabase relation types are complex
        const catalogoMaestro = productoNegocio.catalogo_maestro as any as {
          id: string;
          nombre: string;
          descripcion: string;
          embedding: number[];
        } | null;
        
        if (!catalogoMaestro?.embedding || !solicitud.embedding) {
          console.log("Skipping - missing embedding");
          continue;
        }

        // Calcular similitud coseno manualmente
        // similitud = 1 - distancia_coseno
        // En pgvector: <=> es el operador de distancia coseno
        // Pero como ya tenemos los embeddings, calculamos en el servidor
        
        // Hacer query directa con el operador de distancia
        const { data: similitudResult, error: similitudError } = await supabase.rpc(
          "calcular_similitud_coseno",
          {
            embedding_a: solicitud.embedding,
            embedding_b: catalogoMaestro.embedding,
          }
        );

        if (similitudError) {
          console.error("Error calculando similitud:", similitudError);
          continue;
        }

        const similitud = similitudResult as number;

        console.log(`Similitud calculada: ${similitud.toFixed(3)} entre solicitud "${solicitud.producto_descripcion}" y producto "${catalogoMaestro.nombre}"`);

        // Verificar si cumple el threshold de 70%
        if (similitud >= 0.7) {
          console.log(`✓ Match encontrado! ${(similitud * 100).toFixed(1)}%`);
          matches.push({
            negocio_catalogo_id: productoNegocio.id,
            producto_id: catalogoMaestro.id,
            producto_nombre: catalogoMaestro.nombre,
            producto_descripcion: catalogoMaestro.descripcion,
            precio_unitario: productoNegocio.precio_negocio,
            stock_disponible: productoNegocio.stock_disponible,
            similitud: similitud,
          });
        }
      }

      console.log(`Solicitud "${solicitud.producto_descripcion}" tiene ${matches.length} matches`);

      // Si hay al menos un match, agregar la solicitud
      if (matches.length > 0) {
        // Obtener datos del usuario
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id, nombre_completo, email")
          .eq("id", solicitud.user_id)
          .single();

        // Verificar si ya envió oferta
        const { data: ofertaExistente } = await supabase
          .from("ofertas")
          .select("id, estado")
          .eq("carrito_id", solicitud.id)
          .eq("negocio_id", id)
          .single();

        solicitudesConMatch.push({
          id: solicitud.id,
          producto_descripcion: solicitud.producto_descripcion,
          cantidad: solicitud.cantidad,
          embedding: solicitud.embedding,
          estado: solicitud.estado,
          created_at: solicitud.created_at,
          user_id: solicitud.user_id,
          usuarios: usuario || null,
          matches: matches.sort((a, b) => b.similitud - a.similitud),
          oferta_enviada: !!ofertaExistente,
          oferta_estado: ofertaExistente?.estado || null,
        });
      }
    }

    console.log(`Total de solicitudes con match: ${solicitudesConMatch.length}`);

    return NextResponse.json({
      success: true,
      solicitudes: solicitudesConMatch,
      total: solicitudesConMatch.length,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}
