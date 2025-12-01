import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    // Obtener pagos en efectivo del negocio
    const { data: pagos, error } = await supabase
      .from("pagos")
      .select(`
        id,
        oferta_id,
        carrito_id,
        monto,
        metodo_pago,
        estado,
        confirmado_por_negocio,
        fecha_confirmacion,
        created_at,
        carrito:carrito_id (
          id,
          producto_descripcion,
          cantidad,
          user_id
        ),
        ofertas:oferta_id (
          cantidad_ofrecida,
          precio_unitario
        )
      `)
      .eq("negocio_id", id)
      .eq("metodo_pago", "efectivo")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo pagos:", error);
      return NextResponse.json(
        { error: "Error obteniendo pagos" },
        { status: 500 }
      );
    }

    // Obtener información de usuarios por separado
    const pagosConUsuarios = await Promise.all(
      (pagos || []).map(async (pago) => {
        const carrito = Array.isArray(pago.carrito) ? pago.carrito[0] : pago.carrito;
        const ofertas = Array.isArray(pago.ofertas) ? pago.ofertas[0] : pago.ofertas;
        
        if (!carrito?.user_id) {
          return {
            ...pago,
            carrito: {
              ...carrito,
              usuarios: null,
            },
            ofertas,
          };
        }

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("nombre_completo, email")
          .eq("id", carrito.user_id)
          .single();

        return {
          ...pago,
          carrito: {
            ...carrito,
            usuarios: usuario || null,
          },
          ofertas,
        };
      })
    );

    return NextResponse.json({
      success: true,
      pagos: pagosConUsuarios,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}
