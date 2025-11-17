import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener items del carrito con conteo de ofertas
    const { data: carrito, error } = await supabase
      .from("carrito")
      .select(`
        *,
        ofertas:ofertas(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo carrito:", error);
      return NextResponse.json(
        { error: "Error obteniendo carrito" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      carrito: carrito || [],
    });
  } catch (error) {
    console.error("Error en carrito:", error);
    return NextResponse.json(
      {
        error: "Error procesando solicitud",
        detalles: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
