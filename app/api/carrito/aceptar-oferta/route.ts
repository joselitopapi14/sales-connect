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
    const { oferta_id, carrito_id, metodo_pago } = body;

    if (!oferta_id || !carrito_id || !metodo_pago) {
      return NextResponse.json(
        { error: "oferta_id, carrito_id y metodo_pago son requeridos" },
        { status: 400 }
      );
    }

    if (!["tarjeta", "efectivo"].includes(metodo_pago)) {
      return NextResponse.json(
        { error: "Método de pago inválido. Debe ser 'tarjeta' o 'efectivo'" },
        { status: 400 }
      );
    }

    // Verificar que el item del carrito pertenece al usuario
    const { data: carritoItem, error: carritoError } = await supabase
      .from("carrito")
      .select("id, user_id, estado")
      .eq("id", carrito_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (carritoError) {
      console.error("Error obteniendo carrito:", carritoError);
    }

    if (carritoError || !carritoItem) {
      return NextResponse.json(
        { error: "Item del carrito no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el item no esté ya reservado o completado
    if (["reservado", "completado"].includes(carritoItem.estado)) {
      return NextResponse.json(
        { error: "Este producto ya tiene una oferta aceptada" },
        { status: 400 }
      );
    }

    // Verificar que la oferta existe y pertenece a este carrito
    const { data: oferta, error: ofertaError } = await supabase
      .from("ofertas")
      .select("id, carrito_id, negocio_id, negocio_catalogo_id, cantidad_ofrecida, precio_total, estado")
      .eq("id", oferta_id)
      .eq("carrito_id", carrito_id)
      .maybeSingle();

    if (ofertaError) {
      console.error("Error obteniendo oferta:", ofertaError);
    }

    if (ofertaError || !oferta) {
      return NextResponse.json(
        { error: "Oferta no encontrada" },
        { status: 404 }
      );
    }

    if (oferta.estado === "reservada") {
      return NextResponse.json(
        { error: "Esta oferta ya fue aceptada" },
        { status: 400 }
      );
    }

    // Verificar stock disponible antes de procesar
    const { data: catalogoItem, error: catalogoError } = await supabase
      .from("negocio_catalogo")
      .select("stock_disponible, stock_reservado")
      .eq("id", oferta.negocio_catalogo_id)
      .maybeSingle();

    if (catalogoError) {
      console.error("Error obteniendo catálogo:", {
        error: catalogoError,
        negocio_catalogo_id: oferta.negocio_catalogo_id,
        oferta_id: oferta.id,
      });
    }

    if (catalogoError || !catalogoItem) {
      return NextResponse.json(
        { 
          error: "Producto no encontrado en el catálogo. Es posible que el negocio haya eliminado este producto.",
          detalles: catalogoError?.message 
        },
        { status: 404 }
      );
    }

    const stockReservado = catalogoItem.stock_reservado || 0;
    const stockDisponibleReal = catalogoItem.stock_disponible - stockReservado;
    if (stockDisponibleReal < oferta.cantidad_ofrecida) {
      return NextResponse.json(
        { error: `Stock insuficiente. Solo hay ${stockDisponibleReal} unidades disponibles` },
        { status: 400 }
      );
    }

    // Actualizar el estado de la oferta a "reservada"
    const { error: updateOfertaError } = await supabase
      .from("ofertas")
      .update({ estado: "reservada" })
      .eq("id", oferta_id);

    if (updateOfertaError) {
      console.error("Error actualizando oferta:", updateOfertaError);
      return NextResponse.json(
        { error: "Error aceptando la oferta" },
        { status: 500 }
      );
    }

    // Actualizar el estado del carrito a "reservado"
    const { error: updateCarritoError } = await supabase
      .from("carrito")
      .update({ estado: "reservado" })
      .eq("id", carrito_id);

    if (updateCarritoError) {
      console.error("Error actualizando carrito:", updateCarritoError);
      return NextResponse.json(
        { error: "Error actualizando el carrito" },
        { status: 500 }
      );
    }

    // Crear registro de pago
    const estadoPagoInicial = metodo_pago === "tarjeta" ? "completado" : "pendiente";
    const { error: pagoError } = await supabase
      .from("pagos")
      .insert({
        oferta_id: oferta_id,
        carrito_id: carrito_id,
        user_id: user.id,
        negocio_id: oferta.negocio_id,
        monto: oferta.precio_total,
        metodo_pago: metodo_pago,
        estado: estadoPagoInicial,
        confirmado_por_negocio: metodo_pago === "tarjeta",
        fecha_confirmacion: metodo_pago === "tarjeta" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (pagoError) {
      console.error("Error creando pago:", pagoError);
      // Revertir cambios en carrito
      await supabase
        .from("carrito")
        .update({ estado: carritoItem.estado })
        .eq("id", carrito_id);
      
      return NextResponse.json(
        { error: "Error procesando el pago" },
        { status: 500 }
      );
    }

    // Para pagos con tarjeta, actualizar estados inmediatamente
    if (metodo_pago === "tarjeta") {
      // Actualizar oferta a completada
      await supabase
        .from("ofertas")
        .update({ estado: "completada" })
        .eq("id", oferta_id);
      
      // Actualizar carrito a completado
      await supabase
        .from("carrito")
        .update({ estado: "completado" })
        .eq("id", carrito_id);
    }

    // Rechazar todas las demás ofertas para este carrito
    const { error: rechazarOtrasError } = await supabase
      .from("ofertas")
      .update({ estado: "rechazada" })
      .eq("carrito_id", carrito_id)
      .neq("id", oferta_id)
      .in("estado", ["enviada", "pendiente"]);

    if (rechazarOtrasError) {
      console.error("Error rechazando otras ofertas:", rechazarOtrasError);
      // No retornamos error aquí porque la oferta principal ya fue aceptada
    }

    return NextResponse.json({
      success: true,
      message: metodo_pago === "tarjeta" 
        ? "¡Pago procesado! Tu compra ha sido confirmada"
        : "¡Oferta reservada! Paga en efectivo en el negocio para completar tu compra",
      metodo_pago,
      requiere_confirmacion: metodo_pago === "efectivo",
    });
  } catch (error) {
    console.error("Error en POST aceptar-oferta:", error);
    return NextResponse.json(
      {
        error: "Error procesando solicitud",
        detalles: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
