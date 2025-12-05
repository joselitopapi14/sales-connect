import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: carritoId } = await params;

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que el item del carrito pertenece al usuario
    const { data: carritoItem, error: carritoError } = await supabase
      .from("carrito")
      .select("id, user_id")
      .eq("id", carritoId)
      .eq("user_id", user.id)
      .single();

    if (carritoError || !carritoItem) {
      return NextResponse.json(
        { error: "Item del carrito no encontrado" },
        { status: 404 }
      );
    }

    // Obtener las ofertas para este item
    const { data: ofertas, error: ofertasError } = await supabase
      .from("ofertas")
      .select(
        `
        id,
        negocio_id,
        cantidad_ofrecida,
        precio_unitario,
        precio_total,
        mensaje,
        similitud_score,
        estado,
        created_at,
        negocios (
          nombre_comercial,
          direccion,
          telefono
        )
      `
      )
      .eq("carrito_id", carritoId)
      .order("created_at", { ascending: false });

    if (ofertasError) {
      console.error("Error obteniendo ofertas:", ofertasError);
      return NextResponse.json(
        { error: "Error obteniendo ofertas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ofertas: ofertas || [] });
  } catch (error) {
    console.error("Error en /api/carrito/[id]/ofertas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
