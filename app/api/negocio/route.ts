import { NextRequest, NextResponse } from "next/server";

// GET /api/negocio - Obtener información del negocio o todos los negocios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    const ciudad = searchParams.get("ciudad");

    // Aquí iría la lógica para obtener los negocios de la base de datos
    // Por ahora retornamos datos de ejemplo
    const negocios = [
      {
        id: "neg1",
        nombre: "Plomería Express",
        descripcion: "Servicios de plomería 24/7",
        categoria: "Hogar",
        ciudad: "Ciudad de México",
        telefono: "+52 55 1234 5678",
        email: "contacto@plomeriaexpress.com",
        calificacion: 4.5,
        servicios: ["Reparaciones", "Instalaciones", "Emergencias"],
        horario: "Lun-Dom 24 horas",
        fechaRegistro: new Date().toISOString(),
      },
      {
        id: "neg2",
        nombre: "Diseño Creativo",
        descripcion: "Agencia de diseño gráfico y branding",
        categoria: "Diseño",
        ciudad: "Guadalajara",
        telefono: "+52 33 8765 4321",
        email: "hola@disenocreativo.com",
        calificacion: 4.8,
        servicios: ["Logo", "Branding", "Marketing Digital"],
        horario: "Lun-Vie 9:00-18:00",
        fechaRegistro: new Date().toISOString(),
      },
    ];

    // Filtrar por categoría o ciudad si se proporciona
    let resultado = negocios;
    if (categoria) {
      resultado = resultado.filter((n) => n.categoria === categoria);
    }
    if (ciudad) {
      resultado = resultado.filter((n) => n.ciudad === ciudad);
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
        error: "Error al obtener los negocios",
      },
      { status: 500 }
    );
  }
}

// POST /api/negocio - Registrar un nuevo negocio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      descripcion,
      categoria,
      ciudad,
      telefono,
      email,
      servicios,
      horario,
    } = body;

    // Validación básica
    if (!nombre || !descripcion || !categoria || !ciudad || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan campos requeridos: nombre, descripcion, categoria, ciudad, email",
        },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Formato de email inválido",
        },
        { status: 400 }
      );
    }

    // Aquí iría la lógica para crear el negocio en la base de datos
    const nuevoNegocio = {
      id: `neg${Date.now()}`,
      nombre,
      descripcion,
      categoria,
      ciudad,
      telefono: telefono || "",
      email,
      calificacion: 0,
      servicios: servicios || [],
      horario: horario || "Por confirmar",
      fechaRegistro: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: nuevoNegocio,
        message: "Negocio registrado exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al registrar el negocio",
      },
      { status: 500 }
    );
  }
}
