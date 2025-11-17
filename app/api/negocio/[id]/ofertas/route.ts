import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/negocio/[id]/ofertas - Obtener ofertas de un negocio para solicitudes
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Aquí iría la lógica para obtener las ofertas del negocio
    const ofertas = [
      {
        id: "oferta1",
        negocioId: id,
        solicitudId: "sol123",
        mensaje: "Podemos ayudarle con su solicitud",
        precio: 1500,
        tiempoEstimado: "2-3 días",
        estado: "enviada",
        fechaCreacion: new Date().toISOString(),
      },
      {
        id: "oferta2",
        negocioId: id,
        solicitudId: "sol456",
        mensaje: "Tenemos disponibilidad inmediata",
        precio: 2000,
        tiempoEstimado: "1 día",
        estado: "aceptada",
        fechaCreacion: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      data: ofertas,
      total: ofertas.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener las ofertas",
      },
      { status: 500 }
    );
  }
}

// POST /api/negocio/[id]/ofertas - Crear una nueva oferta para una solicitud
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { solicitudId, mensaje, precio, tiempoEstimado } = body;

    // Validación básica
    if (!solicitudId || !mensaje || !precio) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan campos requeridos: solicitudId, mensaje, precio",
        },
        { status: 400 }
      );
    }

    // Aquí iría la lógica para crear la oferta en la base de datos
    const nuevaOferta = {
      id: `oferta${Date.now()}`,
      negocioId: id,
      solicitudId,
      mensaje,
      precio,
      tiempoEstimado: tiempoEstimado || "Por confirmar",
      estado: "enviada",
      fechaCreacion: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: nuevaOferta,
        message: "Oferta enviada exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear la oferta",
      },
      { status: 500 }
    );
  }
}
