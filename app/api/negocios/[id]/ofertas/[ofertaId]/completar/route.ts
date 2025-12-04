import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST - Completar compra (cuando el comprador pagó en el negocio)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; ofertaId: string }> }
) {
  try {
    const { id: negocioId, ofertaId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.log("=== COMPLETANDO COMPRA ===");
    console.log("Negocio ID:", negocioId);
    console.log("Oferta ID:", ofertaId);
    console.log("Usuario:", user.id);

    // Verificar que el negocio pertenece al usuario
    const { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .select("id")
      .eq("id", negocioId)
      .eq("propietario_id", user.id)
      .single();

    if (negocioError || !negocio) {
      console.error("❌ Negocio no encontrado o no autorizado");
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la oferta existe, pertenece al negocio y está reservada
    const { data: oferta, error: ofertaError } = await supabase
      .from("ofertas")
      .select("id, carrito_id, negocio_id, estado")
      .eq("id", ofertaId)
      .eq("negocio_id", negocioId)
      .single();

    if (ofertaError || !oferta) {
      console.error("❌ Oferta no encontrada:", ofertaError);
      return NextResponse.json(
        { error: "Oferta no encontrada" },
        { status: 404 }
      );
    }

    if (oferta.estado !== "reservada") {
      console.error("❌ La oferta no está reservada, estado actual:", oferta.estado);
      return NextResponse.json(
        { error: `La oferta debe estar reservada para completarla. Estado actual: ${oferta.estado}` },
        { status: 400 }
      );
    }

    console.log("✓ Oferta verificada:", oferta);

    // Actualizar oferta a completada
    const { error: updateOfertaError } = await supabase
      .from("ofertas")
      .update({
        estado: "completada",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ofertaId);

    if (updateOfertaError) {
      console.error("❌ Error actualizando oferta:", updateOfertaError);
      return NextResponse.json(
        { error: "Error actualizando oferta" },
        { status: 500 }
      );
    }

    console.log("✓ Oferta actualizada a completada");

    // Actualizar carrito a completado
    const { error: updateCarritoError } = await supabase
      .from("carrito")
      .update({
        estado: "completado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", oferta.carrito_id);

    if (updateCarritoError) {
      console.error("❌ Error actualizando carrito:", updateCarritoError);
      return NextResponse.json(
        { error: "Error actualizando solicitud" },
        { status: 500 }
      );
    }

    console.log("✓ Carrito actualizado a completado");

    return NextResponse.json({
      success: true,
      message: "Compra completada exitosamente",
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
