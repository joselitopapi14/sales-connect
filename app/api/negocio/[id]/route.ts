import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/negocio/[id] - Obtener información de un negocio específico
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Aquí iría la lógica para obtener el negocio de la base de datos
    const negocio = {
      id,
      nombre: "Plomería Express",
      descripcion: "Servicios de plomería profesional 24/7",
      categoria: "Hogar",
      ciudad: "Ciudad de México",
      direccion: "Av. Insurgentes Sur 1234",
      telefono: "+52 55 1234 5678",
      email: "contacto@plomeriaexpress.com",
      sitioWeb: "https://plomeriaexpress.com",
      calificacion: 4.5,
      numeroResenas: 125,
      servicios: ["Reparaciones", "Instalaciones", "Emergencias", "Mantenimiento"],
      horario: "Lun-Dom 24 horas",
      imagenes: [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg",
      ],
      fechaRegistro: new Date().toISOString(),
      verificado: true,
    };

    return NextResponse.json({
      success: true,
      data: negocio,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener el negocio",
      },
      { status: 500 }
    );
  }
}

// PUT /api/negocio/[id] - Actualizar información de un negocio
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Aquí iría la lógica para actualizar el negocio en la base de datos
    const negocioActualizado = {
      id,
      ...body,
      fechaActualizacion: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: negocioActualizado,
      message: "Negocio actualizado exitosamente",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar el negocio",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/negocio/[id] - Eliminar un negocio
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Aquí iría la lógica para eliminar el negocio de la base de datos

    return NextResponse.json({
      success: true,
      message: `Negocio ${id} eliminado exitosamente`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar el negocio",
      },
      { status: 500 }
    );
  }
}
