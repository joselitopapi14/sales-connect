import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener ofertas del negocio
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

    // Obtener ofertas del negocio con información del carrito
    const { data: ofertas, error } = await supabase
      .from("ofertas")
      .select(`
        id,
        cantidad_ofrecida,
        precio_unitario,
        precio_total,
        mensaje,
        similitud_score,
        estado,
        created_at,
        carrito:carrito_id (
          id,
          producto_descripcion,
          cantidad,
          user_id
        )
      `)
      .eq("negocio_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo ofertas:", error);
      return NextResponse.json(
        { error: "Error obteniendo ofertas" },
        { status: 500 }
      );
    }

    // Obtener información de usuarios por separado
    const ofertasConUsuarios = await Promise.all(
      (ofertas || []).map(async (oferta) => {
        if (!oferta.carrito?.user_id) {
          return {
            ...oferta,
            carrito: {
              ...oferta.carrito,
              usuarios: null,
            },
          };
        }

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("nombre_completo, email")
          .eq("id", oferta.carrito.user_id)
          .single();

        return {
          ...oferta,
          carrito: {
            ...oferta.carrito,
            usuarios: usuario || null,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      ofertas: ofertasConUsuarios,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}
