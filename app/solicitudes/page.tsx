"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Solicitud = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: "pendiente" | "activa" | "completada" | "cancelada";
  fechaCreacion: string;
};

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([
    {
      id: "1",
      titulo: "Necesito servicio de plomería",
      descripcion: "Reparación de tubería en la cocina con fuga de agua",
      categoria: "Hogar",
      estado: "activa",
      fechaCreacion: "2024-01-15",
    },
    {
      id: "2",
      titulo: "Busco diseñador gráfico",
      descripcion: "Necesito diseño de logo para mi nuevo negocio",
      categoria: "Diseño",
      estado: "pendiente",
      fechaCreacion: "2024-01-14",
    },
    {
      id: "3",
      titulo: "Reparación de laptop",
      descripcion: "Mi laptop no enciende, necesito revisión técnica",
      categoria: "Tecnología",
      estado: "completada",
      fechaCreacion: "2024-01-10",
    },
  ]);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    titulo: "",
    descripcion: "",
    categoria: "",
  });

  const estadoColors = {
    pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
    activa: "bg-blue-100 text-blue-800 border-blue-300",
    completada: "bg-green-100 text-green-800 border-green-300",
    cancelada: "bg-red-100 text-red-800 border-red-300",
  };

  const handleCrearSolicitud = () => {
    if (nuevaSolicitud.titulo && nuevaSolicitud.descripcion && nuevaSolicitud.categoria) {
      const solicitud: Solicitud = {
        id: Date.now().toString(),
        titulo: nuevaSolicitud.titulo,
        descripcion: nuevaSolicitud.descripcion,
        categoria: nuevaSolicitud.categoria,
        estado: "pendiente",
        fechaCreacion: new Date().toISOString().split("T")[0],
      };
      setSolicitudes([solicitud, ...solicitudes]);
      setNuevaSolicitud({ titulo: "", descripcion: "", categoria: "" });
      setMostrarFormulario(false);
    }
  };

  return (
    <div className="min-h-screen mt-5 bg-linear-to-b from-white to-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-700 mb-2">
              Mis Solicitudes
            </h1>
            <p className="text-neutral-600">
              Gestiona todas tus solicitudes de servicio en un solo lugar
            </p>
          </div>
          <Button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-slate-700 hover:bg-gray-700 text-white"
          >
            {mostrarFormulario ? "Cancelar" : "Nueva Solicitud"}
          </Button>
        </div>

        {mostrarFormulario && (
          <Card className="mb-8 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-700">Crear Nueva Solicitud</CardTitle>
              <CardDescription>
                Describe lo que necesitas y los negocios te contactarán
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-slate-700 mb-2">
                  Título
                </label>
                <Input
                  id="titulo"
                  placeholder="¿Qué servicio necesitas?"
                  value={nuevaSolicitud.titulo}
                  onChange={(e) =>
                    setNuevaSolicitud({ ...nuevaSolicitud, titulo: e.target.value })
                  }
                  className="border-slate-300"
                />
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe los detalles de tu solicitud..."
                  value={nuevaSolicitud.descripcion}
                  onChange={(e) =>
                    setNuevaSolicitud({
                      ...nuevaSolicitud,
                      descripcion: e.target.value,
                    })
                  }
                  rows={4}
                  className="border-slate-300"
                />
              </div>
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-slate-700 mb-2">
                  Categoría
                </label>
                <Input
                  id="categoria"
                  placeholder="Ej: Hogar, Diseño, Tecnología..."
                  value={nuevaSolicitud.categoria}
                  onChange={(e) =>
                    setNuevaSolicitud({
                      ...nuevaSolicitud,
                      categoria: e.target.value,
                    })
                  }
                  className="border-slate-300"
                />
              </div>
              <Button
                onClick={handleCrearSolicitud}
                className="w-full bg-slate-700 hover:bg-gray-700 text-white"
              >
                Crear Solicitud
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {solicitudes.map((solicitud) => (
            <Card
              key={solicitud.id}
              className="border-slate-200 hover:shadow-xl transition-shadow duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-slate-700 text-lg mb-2">
                      {solicitud.titulo}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={estadoColors[solicitud.estado]}
                    >
                      {solicitud.estado.charAt(0).toUpperCase() +
                        solicitud.estado.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 text-sm mb-4">
                  {solicitud.descripcion}
                </p>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-medium text-slate-700">
                    {solicitud.categoria}
                  </span>
                  <span>{solicitud.fechaCreacion}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Ver detalles
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Ofertas (0)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {solicitudes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500 text-lg mb-4">
              No tienes solicitudes aún
            </p>
            <Button
              onClick={() => setMostrarFormulario(true)}
              className="bg-slate-700 hover:bg-gray-700 text-white"
            >
              Crear tu primera solicitud
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
