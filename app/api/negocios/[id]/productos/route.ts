import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener productos del negocio
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
    const { data: negocio } = await supabase
      .from("negocios")
      .select("id")
      .eq("id", id)
      .eq("propietario_id", user.id)
      .single();

    if (!negocio) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const { data: productos, error } = await supabase
      .from("negocio_catalogo")
      .select(`
        id,
        producto_id,
        precio_negocio,
        nombre_personalizado,
        stock_disponible,
        activo,
        created_at,
        catalogo_maestro:producto_id (
          nombre,
          descripcion,
          categoria
        )
      `)
      .eq("negocio_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo productos:", error);
      return NextResponse.json(
        { error: "Error obteniendo productos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productos: productos || [],
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}

// POST - Agregar productos al negocio
export async function POST(
  request: Request,
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
    const { data: negocio } = await supabase
      .from("negocios")
      .select("id")
      .eq("id", id)
      .eq("propietario_id", user.id)
      .single();

    if (!negocio) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { productos } = body; // Array de { producto_id, precio_negocio, stock_disponible }

    if (!Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos un producto" },
        { status: 400 }
      );
    }

    // Preparar productos para insertar
    const productosParaInsertar = productos.map((p) => ({
      negocio_id: id,
      producto_id: p.producto_id,
      precio_negocio: p.precio_negocio,
      stock_disponible: p.stock_disponible || 0,
      nombre_personalizado: p.nombre_personalizado || null,
      activo: true,
    }));

    const { data: productosInsertados, error } = await supabase
      .from("negocio_catalogo")
      .insert(productosParaInsertar)
      .select();

    if (error) {
      console.error("Error agregando productos:", error);
      return NextResponse.json(
        { error: "Error agregando productos", detalles: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productos: productosInsertados,
      mensaje: `Se agregaron ${productosInsertados.length} productos`,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}
