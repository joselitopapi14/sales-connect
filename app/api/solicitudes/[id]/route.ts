import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/solicitudes/[id] - Obtener una solicitud específica
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Aquí iría la lógica para obtener la solicitud de la base de datos
    const solicitud = {
      id,
      titulo: "Necesito servicio de plomería",
      descripcion: "Reparación de tubería en la cocina",
      categoria: "Hogar",
      estado: "pendiente",
      fechaCreacion: new Date().toISOString(),
      usuarioId: "user123",
      ofertas: [],
    };

    return NextResponse.json({
      success: true,
      data: solicitud,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener la solicitud",
      },
      { status: 500 }
    );
  }
}

// PUT /api/solicitudes/[id] - Actualizar una solicitud
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { titulo, descripcion, categoria, estado } = body;

    // Aquí iría la lógica para actualizar la solicitud en la base de datos
    const solicitudActualizada = {
      id,
      titulo: titulo || "Necesito servicio de plomería",
      descripcion: descripcion || "Reparación de tubería en la cocina",
      categoria: categoria || "Hogar",
      estado: estado || "pendiente",
      fechaActualizacion: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: solicitudActualizada,
      message: "Solicitud actualizada exitosamente",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar la solicitud",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/solicitudes/[id] - Eliminar una solicitud
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Aquí iría la lógica para eliminar la solicitud de la base de datos

    return NextResponse.json({
      success: true,
      message: `Solicitud ${id} eliminada exitosamente`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar la solicitud",
      },
      { status: 500 }
    );
  }
}
