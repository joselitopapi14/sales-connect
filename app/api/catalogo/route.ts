import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener productos del catálogo maestro con paginación
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener parámetros de paginación
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "100");
    const search = searchParams.get("search") || "";

    // Calcular rango
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("catalogo_maestro")
      .select("id, nombre, descripcion, categoria", { count: "exact" })
      .order("nombre");

    // Aplicar búsqueda si existe
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,descripcion.ilike.%${search}%,categoria.ilike.%${search}%`);
    }

    const { data: productos, error, count } = await query.range(from, to);

    if (error) {
      console.error("Error obteniendo catálogo:", error);
      return NextResponse.json(
        { error: "Error obteniendo catálogo" },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return NextResponse.json({
      success: true,
      productos: productos || [],
      total: count || 0,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}
