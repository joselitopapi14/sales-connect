import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST - Cerrar carrito (activa proceso de domicilio)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: carritoId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.log("=== CERRANDO CARRITO ===");
    console.log("Carrito ID:", carritoId);
    console.log("Usuario:", user.id);

    // Llamar función que valida y cierra el carrito
    const { data, error } = await supabase.rpc("cerrar_carrito", {
      p_carrito_id: carritoId,
    });

    if (error) {
      console.error("❌ Error cerrando carrito:", error);
      return NextResponse.json(
        { error: error.message || "Error cerrando carrito" },
        { status: 500 }
      );
    }

    // La función retorna JSONB con {success, error?, message?, carrito_id?}
    const result = data as { success: boolean; error?: string; message?: string; carrito_id?: string };

    if (!result.success) {
      console.error("❌ No se pudo cerrar:", result.error);
      return NextResponse.json(
        { error: result.error || "No se pudo cerrar el carrito" },
        { status: 400 }
      );
    }

    console.log("✓ Carrito cerrado exitosamente");
    return NextResponse.json({
      success: true,
      message: result.message || "Carrito cerrado exitosamente",
      carritoId: result.carrito_id,
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
