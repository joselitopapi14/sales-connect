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

    // Obtener items del carrito agrupados por solicitud con ofertas
    const { data: carrito, error } = await supabase
      .from("carrito")
      .select(`
        id,
        user_id,
        solicitud_id,
        producto_descripcion,
        cantidad,
        estado,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo carrito:", {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { 
          error: "Error obteniendo carrito",
          detalles: error.message,
        },
        { status: 500 }
      );
    }

    // Obtener IDs de items para buscar ofertas
    const itemIds = (carrito || []).map((item) => item.id);
    
    const ofertasMap: Record<string, unknown[]> = {};
    
    if (itemIds.length > 0) {
      const { data: ofertas } = await supabase
        .from("ofertas")
        .select(`
          id,
          carrito_id,
          negocio_id,
          precio_ofertado,
          stock_disponible,
          mensaje,
          estado,
          created_at,
          negocios:negocios(
            nombre,
            descripcion
          )
        `)
        .in("carrito_id", itemIds);
      
      // Agrupar ofertas por carrito_id
      (ofertas || []).forEach((oferta) => {
        if (!ofertasMap[oferta.carrito_id]) {
          ofertasMap[oferta.carrito_id] = [];
        }
        ofertasMap[oferta.carrito_id].push(oferta);
      });
    }

    // Agregar ofertas a cada item
    const carritoConOfertas = (carrito || []).map((item) => ({
      ...item,
      ofertas: ofertasMap[item.id] || [],
    }));

    // Agrupar items por solicitud_id
    const solicitudesAgrupadas: Record<string, {
      solicitud_id: string;
      created_at: string;
      items: unknown[];
    }> = {};
    
    carritoConOfertas.forEach((item) => {
      const solicitudId = item.solicitud_id;
      if (!solicitudesAgrupadas[solicitudId]) {
        solicitudesAgrupadas[solicitudId] = {
          solicitud_id: solicitudId,
          created_at: item.created_at,
          items: [],
        };
      }
      solicitudesAgrupadas[solicitudId].items.push(item);
    });

    // Convertir a array y ordenar por fecha
    const solicitudes = Object.values(solicitudesAgrupadas).sort(
      (a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      }
    );

    return NextResponse.json({
      success: true,
      solicitudes,
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
