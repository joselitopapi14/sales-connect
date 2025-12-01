import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { pago_id } = body;

    if (!pago_id) {
      return NextResponse.json(
        { error: "pago_id es requerido" },
        { status: 400 }
      );
    }

    // Obtener el pago y verificar que pertenece a un negocio del usuario
    const { data: pago, error: pagoError } = await supabase
      .from("pagos")
      .select(`
        id,
        oferta_id,
        carrito_id,
        negocio_id,
        metodo_pago,
        estado,
        confirmado_por_negocio,
        negocios:negocio_id (
          propietario_id
        )
      `)
      .eq("id", pago_id)
      .single();

    if (pagoError || !pago) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el negocio pertenece al usuario autenticado
    const negocio = Array.isArray(pago.negocios) ? pago.negocios[0] : pago.negocios;
    if (!negocio || negocio.propietario_id !== user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Verificar que sea pago en efectivo
    if (pago.metodo_pago !== "efectivo") {
      return NextResponse.json(
        { error: "Solo se pueden confirmar pagos en efectivo" },
        { status: 400 }
      );
    }

    // Verificar que no esté ya confirmado
    if (pago.confirmado_por_negocio) {
      return NextResponse.json(
        { error: "Este pago ya fue confirmado" },
        { status: 400 }
      );
    }

    // Confirmar el pago - los triggers se encargarán del resto
    const { error: updateError } = await supabase
      .from("pagos")
      .update({
        confirmado_por_negocio: true,
        fecha_confirmacion: new Date().toISOString(),
      })
      .eq("id", pago_id);

    if (updateError) {
      console.error("Error confirmando pago:", updateError);
      return NextResponse.json(
        { error: "Error confirmando el pago: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pago en efectivo confirmado. Stock actualizado correctamente",
    });
  } catch (error) {
    console.error("Error en POST confirmar-pago:", error);
    return NextResponse.json(
      {
        error: "Error procesando solicitud",
        detalles: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
