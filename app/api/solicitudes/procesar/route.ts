import { createClient } from "@/lib/supabase/server";
import { fraccionarSolicitud, generarEmbedding } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener el input del usuario
    const { input } = await request.json();

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return NextResponse.json(
        { error: "Input inválido" },
        { status: 400 }
      );
    }

    // Fraccionar el input en productos individuales
    const productosFraccionados = await fraccionarSolicitud(input);

    if (productosFraccionados.length === 0) {
      return NextResponse.json(
        { error: "No se pudieron extraer productos del input" },
        { status: 400 }
      );
    }

    // Generar embeddings y guardar en el carrito
    const itemsGuardados = [];

    for (const producto of productosFraccionados) {
      try {
        // Generar embedding para el producto
        const embedding = await generarEmbedding(producto.descripcion);

        // Insertar en la tabla carrito
        const { data, error } = await supabase
          .from("carrito")
          .insert({
            user_id: user.id,
            producto_descripcion: producto.descripcion,
            cantidad: producto.cantidad,
            embedding: embedding,
            estado: "pendiente",
          })
          .select()
          .single();

        if (error) {
          console.error("Error insertando en carrito:", error);
          throw error;
        }

        itemsGuardados.push(data);
      } catch (error) {
        console.error(`Error procesando producto "${producto.descripcion}":`, error);
        // Continuar con los siguientes productos incluso si uno falla
      }
    }

    if (itemsGuardados.length === 0) {
      return NextResponse.json(
        { error: "No se pudo guardar ningún producto en el carrito" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: `Se guardaron ${itemsGuardados.length} productos en tu carrito`,
      items: itemsGuardados,
    });
  } catch (error) {
    console.error("Error procesando solicitud:", error);
    return NextResponse.json(
      { 
        error: "Error procesando solicitud", 
        detalles: error instanceof Error ? error.message : "Error desconocido" 
      },
      { status: 500 }
    );
  }
}
