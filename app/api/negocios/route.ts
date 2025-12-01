import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Obtener negocios del usuario
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: negocios, error } = await supabase
      .from("negocios")
      .select("*")
      .eq("propietario_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo negocios:", error);
      return NextResponse.json(
        { error: "Error obteniendo negocios" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      negocios: negocios || [],
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error procesando solicitud" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo negocio
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre_comercial, direccion, telefono, categoria } = body;

    if (!nombre_comercial || !direccion) {
      return NextResponse.json(
        { error: "Nombre comercial y dirección son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el usuario exista en la tabla usuarios
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!usuario) {
      // Crear usuario si no existe
      const { error: createUserError } = await supabase
        .from("usuarios")
        .insert({
          id: user.id,
          email: user.email,
          nombre_completo: user.user_metadata?.full_name || user.email?.split("@")[0],
        });

      if (createUserError) {
        console.error("Error creando usuario:", createUserError);
      }
    }

    const { data: negocio, error } = await supabase
      .from("negocios")
      .insert({
        propietario_id: user.id,
        nombre_comercial,
        direccion,
        telefono: telefono || null,
        categoria: categoria || null,
        activo: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creando negocio:", error);
      return NextResponse.json(
        { error: "Error creando negocio", detalles: error.message },
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
