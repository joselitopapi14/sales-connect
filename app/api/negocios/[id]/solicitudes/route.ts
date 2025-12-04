import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener solicitudes (carrito) con match >= 70% para productos del negocio
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

    // Usar función optimizada que hace todo en PostgreSQL
    console.log("Llamando a obtener_solicitudes_con_matches con:", {
      p_negocio_id: id,
      p_threshold: 0.7,
      p_limit: 50
    });
    
    const { data: solicitudesData, error: solicitudesError } = await supabase
      .rpc('obtener_solicitudes_con_matches', {
        p_negocio_id: id,
        p_threshold: 0.7,
        p_limit: 50
      });

    if (solicitudesError) {
      console.error("Error obteniendo solicitudes:", {
        error: solicitudesError,
        message: solicitudesError.message,
        details: solicitudesError.details,
        hint: solicitudesError.hint,
        code: solicitudesError.code,
      });
      return NextResponse.json(
        { 
          error: "Error obteniendo solicitudes",
          detalles: solicitudesError.message
        },
        { status: 500 }
      );
    }
    
    console.log("Datos recibidos:", solicitudesData?.length, "solicitudes");

    // Transformar los datos al formato esperado por el frontend
    const solicitudes = (solicitudesData || []).map((row: {
      solicitud_id: string;
      solicitud_descripcion: string;
      solicitud_cantidad: number;
      solicitud_estado: string;
      solicitud_created_at: string;
      solicitud_user_id: string;
      usuario_nombre: string | null;
      usuario_email: string;
      matches: unknown;
      oferta_enviada: boolean;
      oferta_estado: string | null;
    }) => ({
      id: row.solicitud_id,
      producto_descripcion: row.solicitud_descripcion,
      cantidad: row.solicitud_cantidad,
      estado: row.solicitud_estado,
      created_at: row.solicitud_created_at,
      user_id: row.solicitud_user_id,
      usuarios: {
        id: row.solicitud_user_id,
        nombre_completo: row.usuario_nombre,
        email: row.usuario_email,
      },
      matches: row.matches,
      oferta_enviada: row.oferta_enviada,
      oferta_estado: row.oferta_estado,
    }));

    return NextResponse.json({
      success: true,
      solicitudes: solicitudes,
      total: solicitudes.length,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}
