import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST - Enviar oferta para una solicitud
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; solicitudId: string }> }
) {
  try {
    console.log("=== INICIO POST Ofertar ===");
    const { id, solicitudId } = await params;
    console.log("Params:", { id, solicitudId });
    
    const body = await request.json();
    console.log("Body recibido:", body);
    
    const {
      negocio_catalogo_id,
      cantidad_ofrecida,
      precio_unitario,
      mensaje,
      similitud_score,
    } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("❌ Usuario no autenticado");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    
    console.log("✓ Usuario autenticado:", user.id);

    // Validaciones
    if (!negocio_catalogo_id || !cantidad_ofrecida || !precio_unitario) {
      console.log("❌ Datos incompletos:", { negocio_catalogo_id, cantidad_ofrecida, precio_unitario });
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    if (cantidad_ofrecida <= 0 || precio_unitario <= 0) {
      console.log("❌ Cantidad o precio inválido");
      return NextResponse.json(
        { error: "Cantidad y precio deben ser mayores a 0" },
        { status: 400 }
      );
    }
    
    console.log("✓ Validaciones básicas pasadas");

    // Verificar que el negocio pertenece al usuario
    console.log("Verificando negocio...");
    const { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .select("id")
      .eq("id", id)
      .eq("propietario_id", user.id)
      .single();

    if (negocioError || !negocio) {
      console.log("❌ Error negocio:", negocioError);
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }
    
    console.log("✓ Negocio verificado");

    // Verificar que la solicitud existe y está activa
    console.log("Verificando solicitud...");
    const { data: solicitud, error: solicitudError } = await supabase
      .from("carrito")
      .select("id, estado, cantidad")
      .eq("id", solicitudId)
      .in("estado", ["pendiente", "con_ofertas"])
      .single();

    if (solicitudError || !solicitud) {
      console.log("❌ Error solicitud:", solicitudError);
      return NextResponse.json(
        { error: "Solicitud no encontrada o ya no está disponible" },
        { status: 404 }
      );
    }
    
    console.log("✓ Solicitud verificada:", solicitud);

    // Verificar que el producto del negocio existe y tiene stock
    console.log("Verificando producto...");
    const { data: productoNegocio, error: productoError } = await supabase
      .from("negocio_catalogo")
      .select("id, precio_negocio, stock_disponible")
      .eq("id", negocio_catalogo_id)
      .eq("negocio_id", id)
      .eq("activo", true)
      .single();

    if (productoError || !productoNegocio) {
      console.log("❌ Error producto:", productoError);
      return NextResponse.json(
        { error: "Producto no encontrado en tu catálogo" },
        { status: 404 }
      );
    }

    if (productoNegocio.stock_disponible < cantidad_ofrecida) {
      console.log("❌ Stock insuficiente:", { disponible: productoNegocio.stock_disponible, solicitado: cantidad_ofrecida });
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${productoNegocio.stock_disponible}` },
        { status: 400 }
      );
    }
    
    console.log("✓ Producto verificado:", productoNegocio);

    // Verificar si ya envió una oferta para esta solicitud
    console.log("Verificando oferta existente...");
    const { data: ofertaExistente } = await supabase
      .from("ofertas")
      .select("id")
      .eq("carrito_id", solicitudId)
      .eq("negocio_id", id)
      .single();

    if (ofertaExistente) {
      console.log("❌ Oferta ya existe:", ofertaExistente.id);
      return NextResponse.json(
        { error: "Ya enviaste una oferta para esta solicitud" },
        { status: 400 }
      );
    }
    
    console.log("✓ No hay oferta previa");

    // Calcular precio total
    const precio_total = precio_unitario * cantidad_ofrecida;
    console.log("Precio total calculado:", precio_total);

    // Crear oferta
    console.log("Creando oferta...");
    const ofertaData = {
      carrito_id: solicitudId,
      negocio_id: id,
      negocio_catalogo_id,
      cantidad_ofrecida,
      precio_unitario,
      precio_total,
      mensaje: mensaje || null,
      similitud_score: similitud_score || null,
      estado: "enviada",
    };
    console.log("Datos de oferta:", ofertaData);
    
    const { data: oferta, error: ofertaError } = await supabase
      .from("ofertas")
      .insert(ofertaData)
      .select()
      .single();

    if (ofertaError) {
      console.error("❌ Error creando oferta:", {
        error: ofertaError,
        message: ofertaError.message,
        details: ofertaError.details,
        hint: ofertaError.hint,
        code: ofertaError.code,
      });
      return NextResponse.json(
        { error: "Error creando oferta", detalles: ofertaError.message },
        { status: 500 }
      );
    }
    
    console.log("✓ Oferta creada:", oferta);

    // Actualizar estado del carrito a 'con_ofertas' si estaba 'pendiente'
    if (solicitud.estado === "pendiente") {
      console.log("Actualizando estado del carrito...");
      await supabase
        .from("carrito")
        .update({ estado: "con_ofertas" })
        .eq("id", solicitudId);
      console.log("✓ Estado actualizado a 'con_ofertas'");
    }

    console.log("=== FIN POST Ofertar - SUCCESS ===");
    return NextResponse.json({
      success: true,
      oferta,
      message: "Oferta enviada exitosamente",
    });
  } catch (error) {
    console.error("❌❌❌ ERROR CATCH:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("Error message:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { 
        error: "Error procesando solicitud",
        detalles: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
