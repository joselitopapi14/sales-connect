import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener un negocio específico
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

    const { data: negocio, error } = await supabase
      .from("negocios")
      .select("*")
      .eq("id", id)
      .eq("propietario_id", user.id)
      .single();

    if (error) {
      console.error("Error obteniendo negocio:", error);
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      negocio,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar negocio
export async function PUT(
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

    const body = await request.json();
    const { nombre_comercial, direccion, telefono, categoria, activo } = body;

    const { data: negocio, error } = await supabase
      .from("negocios")
      .update({
        nombre_comercial,
        direccion,
        telefono: telefono || null,
        categoria: categoria || null,
        activo,
      })
      .eq("id", id)
      .eq("propietario_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando negocio:", error);
      return NextResponse.json(
        { error: "Error actualizando negocio" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      negocio,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}
