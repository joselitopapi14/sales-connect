import { NextRequest, NextResponse } from "next/server";

// GET /api/solicitudes - Obtener todas las solicitudes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const categoria = searchParams.get("categoria");

    // Aquí iría la lógica para obtener las solicitudes de la base de datos
    // Por ahora retornamos datos de ejemplo
    const solicitudes = [
      {
        id: "1",
        titulo: "Necesito servicio de plomería",
        descripcion: "Reparación de tubería en la cocina",
        categoria: "Hogar",
        estado: "pendiente",
        fechaCreacion: new Date().toISOString(),
        usuarioId: "user123",
      },
      {
        id: "2",
        titulo: "Busco diseñador gráfico",
        descripcion: "Necesito diseño de logo para mi negocio",
        categoria: "Diseño",
        estado: "activa",
        fechaCreacion: new Date().toISOString(),
        usuarioId: "user456",
      },
    ];

    // Filtrar por estado si se proporciona
    let resultado = solicitudes;
    if (estado) {
      resultado = resultado.filter((s) => s.estado === estado);
    }
    if (categoria) {
      resultado = resultado.filter((s) => s.categoria === categoria);
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      total: resultado.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener las solicitudes",
      },
      { status: 500 }
    );
  }
}

// POST /api/solicitudes - Crear una nueva solicitud
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, descripcion, categoria, usuarioId } = body;

    // Validación básica
    if (!titulo || !descripcion || !categoria || !usuarioId) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan campos requeridos: titulo, descripcion, categoria, usuarioId",
        },
        { status: 400 }
      );
    }

    // Aquí iría la lógica para crear la solicitud en la base de datos
    const nuevaSolicitud = {
      id: Date.now().toString(),
      titulo,
      descripcion,
      categoria,
      estado: "pendiente",
      fechaCreacion: new Date().toISOString(),
      usuarioId,
    };

    return NextResponse.json(
      {
        success: true,
        data: nuevaSolicitud,
        message: "Solicitud creada exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear la solicitud",
      },
      { status: 500 }
    );
  }
}
