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

    // Verificar que el usuario exista en la tabla usuarios
    const { data: usuarioExistente } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", user.id)
      .single();

    // Si no existe, crearlo
    if (!usuarioExistente) {
      const { error: insertError } = await supabase
        .from("usuarios")
        .insert({
          id: user.id,
          email: user.email,
          nombre_completo: user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
        });

      if (insertError) {
        console.error("Error creando usuario:", insertError);
        return NextResponse.json(
          { error: "Error creando perfil de usuario" },
          { status: 500 }
        );
      }
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

    console.log("Productos fraccionados:", productosFraccionados);

    if (productosFraccionados.length === 0) {
      return NextResponse.json(
        { error: "No se pudieron extraer productos del input" },
        { status: 400 }
      );
    }

    // Generar embeddings y guardar en el carrito
    const itemsGuardados = [];
    const errores: Array<{ producto: string; error: string }> = [];

    for (const producto of productosFraccionados) {
      try {
        console.log(`Procesando producto: ${producto.descripcion}, cantidad: ${producto.cantidad}`);
        
        // Generar embedding para el producto
        const embedding = await generarEmbedding(producto.descripcion);
        console.log(`Embedding generado (primeros 5 valores):`, embedding.slice(0, 5));

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
          console.error("Error insertando en carrito:", {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            producto: producto.descripcion,
          });
          errores.push({
            producto: producto.descripcion,
            error: error.message,
          });
          throw error;
        }

        console.log(`Producto guardado exitosamente:`, data);
        itemsGuardados.push(data);
      } catch (error) {
        console.error(`Error procesando producto "${producto.descripcion}":`, {
          error,
          message: error instanceof Error ? error.message : "Error desconocido",
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Continuar con los siguientes productos incluso si uno falla
      }
    }

    if (itemsGuardados.length === 0) {
      console.error("No se guardó ningún producto. Errores:", errores);
      return NextResponse.json(
        { 
          error: "No se pudo guardar ningún producto en el carrito",
          errores: errores,
          totalProductos: productosFraccionados.length,
        },
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
