import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Usar la función de Supabase para obtener solicitudes que coincidan
    // con los productos del negocio actual (>70% similitud)
    const { data, error } = await supabase.rpc("match_carrito_for_negocio", {
      negocio_user_id: user.id,
      match_threshold: 0.7,
    });

    if (error) {
      console.error("Error obteniendo matches:", error);
      return NextResponse.json(
        { error: "Error obteniendo solicitudes relevantes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      solicitudes: data || [],
    });
  } catch (error) {
    console.error("Error en match de productos:", error);
    return NextResponse.json(
      {
        error: "Error procesando solicitud",
        detalles: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
