import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST - Enviar oferta para una solicitud
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; solicitudId: string }> }
) {
  try {
    const { id, solicitudId } = await params;
    const body = await request.json();
    const {
      negocio_catalogo_id,
      cantidad_ofrecida,
      precio_unitario,
      mensaje,
      similitud_score,
    } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Validaciones
    if (!negocio_catalogo_id || !cantidad_ofrecida || !precio_unitario) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    if (cantidad_ofrecida <= 0 || precio_unitario <= 0) {
      return NextResponse.json(
        { error: "Cantidad y precio deben ser mayores a 0" },
        { status: 400 }
      );
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

    // Verificar que la solicitud existe y está activa
    const { data: solicitud, error: solicitudError } = await supabase
      .from("carrito")
      .select("id, estado, cantidad")
      .eq("id", solicitudId)
      .in("estado", ["pendiente", "con_ofertas"])
      .single();

    if (solicitudError || !solicitud) {
      return NextResponse.json(
        { error: "Solicitud no encontrada o ya no está disponible" },
        { status: 404 }
      );
    }

    // Verificar que el producto del negocio existe y tiene stock
    const { data: productoNegocio, error: productoError } = await supabase
      .from("negocio_catalogo")
      .select("id, precio_negocio, stock_disponible")
      .eq("id", negocio_catalogo_id)
      .eq("negocio_id", id)
      .eq("activo", true)
      .single();

    if (productoError || !productoNegocio) {
      return NextResponse.json(
        { error: "Producto no encontrado en tu catálogo" },
        { status: 404 }
      );
    }

    if (productoNegocio.stock_disponible < cantidad_ofrecida) {
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${productoNegocio.stock_disponible}` },
        { status: 400 }
      );
    }

    // Verificar si ya envió una oferta para esta solicitud
    const { data: ofertaExistente } = await supabase
      .from("ofertas")
      .select("id")
      .eq("carrito_id", solicitudId)
      .eq("negocio_id", id)
      .single();

    if (ofertaExistente) {
      return NextResponse.json(
        { error: "Ya enviaste una oferta para esta solicitud" },
        { status: 400 }
      );
    }

    // Calcular precio total
    const precio_total = precio_unitario * cantidad_ofrecida;

    // Crear oferta
    const { data: oferta, error: ofertaError } = await supabase
      .from("ofertas")
      .insert({
        carrito_id: solicitudId,
        negocio_id: id,
        negocio_catalogo_id,
        cantidad_ofrecida,
        precio_unitario,
        precio_total,
        mensaje: mensaje || null,
        similitud_score: similitud_score || null,
        estado: "enviada",
      })
      .select()
      .single();

    if (ofertaError) {
      console.error("Error creando oferta:", ofertaError);
      return NextResponse.json(
        { error: "Error creando oferta" },
        { status: 500 }
      );
    }

    // Actualizar estado del carrito a 'con_ofertas' si estaba 'pendiente'
    if (solicitud.estado === "pendiente") {
      await supabase
        .from("carrito")
        .update({ estado: "con_ofertas" })
        .eq("id", solicitudId);
    }

    return NextResponse.json({
      success: true,
      oferta,
      message: "Oferta enviada exitosamente",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}
