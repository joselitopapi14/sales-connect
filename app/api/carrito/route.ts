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
      const { data: ofertas, error: ofertasError } = await supabase
        .from("ofertas")
        .select(`
          id,
          carrito_id,
          negocio_id,
          cantidad_ofrecida,
          precio_unitario,
          precio_total,
          mensaje,
          similitud_score,
          estado,
          created_at,
          negocios:negocio_id (
            nombre_comercial,
            direccion,
            telefono
          )
        `)
        .in("carrito_id", itemIds);

      if (ofertasError) {
        console.error("Error obteniendo ofertas:", ofertasError);
      }
      
      // Agrupar ofertas por carrito_id
      (ofertas || []).forEach((oferta: { carrito_id: string }) => {
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

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const carritoId = searchParams.get("id");

    if (!carritoId) {
      return NextResponse.json(
        { error: "ID de carrito requerido" },
        { status: 400 }
      );
    }

    // Verificar que el item pertenece al usuario
    const { data: item, error: itemError } = await supabase
      .from("carrito")
      .select("id, user_id, estado")
      .eq("id", carritoId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }

    if (item.user_id !== user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // No permitir eliminar si ya está reservado o completado
    if (["reservado", "completado"].includes(item.estado)) {
      return NextResponse.json(
        { error: "No se puede eliminar un producto reservado o completado" },
        { status: 400 }
      );
    }

    // Primero eliminar ofertas asociadas (si las hay)
    const { error: ofertasError } = await supabase
      .from("ofertas")
      .delete()
      .eq("carrito_id", carritoId);

    if (ofertasError) {
      console.error("Error eliminando ofertas:", ofertasError);
      return NextResponse.json(
        { error: "Error eliminando ofertas asociadas" },
        { status: 500 }
      );
    }

    // Luego eliminar el item del carrito
    const { error: deleteError } = await supabase
      .from("carrito")
      .delete()
      .eq("id", carritoId);

    if (deleteError) {
      console.error("Error eliminando item del carrito:", deleteError);
      return NextResponse.json(
        { error: "Error eliminando item del carrito" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item eliminado correctamente",
    });
  } catch (error) {
    console.error("Error en DELETE carrito:", error);
    return NextResponse.json(
      {
        error: "Error procesando solicitud",
        detalles: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
