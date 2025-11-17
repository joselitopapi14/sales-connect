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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Negocio = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  ciudad: string;
  telefono: string;
  email: string;
  calificacion: number;
  servicios: string[];
  horario: string;
};

type Oferta = {
  id: string;
  solicitudTitulo: string;
  mensaje: string;
  precio: number;
  estado: "enviada" | "aceptada" | "rechazada";
  fechaCreacion: string;
};

export default function NegocioPage() {
  const [negocio, setNegocio] = useState<Negocio>({
    id: "neg1",
    nombre: "Mi Negocio",
    descripcion: "Servicios profesionales de calidad",
    categoria: "Servicios Generales",
    ciudad: "Ciudad de México",
    telefono: "+52 55 1234 5678",
    email: "contacto@minegocio.com",
    calificacion: 4.5,
    servicios: ["Servicio 1", "Servicio 2", "Servicio 3"],
    horario: "Lun-Vie 9:00-18:00",
  });

  const [ofertas] = useState<Oferta[]>([
    {
      id: "1",
      solicitudTitulo: "Necesito servicio de plomería",
      mensaje: "Puedo ayudarle con su solicitud de inmediato",
      precio: 1500,
      estado: "aceptada",
      fechaCreacion: "2024-01-15",
    },
    {
      id: "2",
      solicitudTitulo: "Reparación de laptop",
      mensaje: "Tengo experiencia en este tipo de reparaciones",
      precio: 800,
      estado: "enviada",
      fechaCreacion: "2024-01-14",
    },
  ]);

  const [editando, setEditando] = useState(false);
  const [datosEditados, setDatosEditados] = useState<Negocio>(negocio);

  const estadoColors = {
    enviada: "bg-blue-100 text-blue-800 border-blue-300",
    aceptada: "bg-green-100 text-green-800 border-green-300",
    rechazada: "bg-red-100 text-red-800 border-red-300",
  };

  const handleGuardarCambios = () => {
    setNegocio(datosEditados);
    setEditando(false);
  };

  const handleCancelarEdicion = () => {
    setDatosEditados(negocio);
    setEditando(false);
  };

  return (
    <div className="min-h-screen mt-10 bg-linear-to-b from-white to-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-700 mb-2">Mi Negocio</h1>
        <p className="text-neutral-600 mb-8">
          Administra tu perfil y las ofertas a tus clientes
        </p>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="perfil">Perfil del Negocio</TabsTrigger>
            <TabsTrigger value="ofertas">Mis Ofertas</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="space-y-6">
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-slate-700">
                    Información del Negocio
                  </CardTitle>
                  <CardDescription>
                    Mantén actualizada la información de tu negocio
                  </CardDescription>
                </div>
                {!editando ? (
                  <Button
                    onClick={() => setEditando(true)}
                    variant="outline"
                    className="border-slate-300 text-slate-700"
                  >
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGuardarCambios}
                      className="bg-slate-700 hover:bg-gray-700"
                    >
                      Guardar
                    </Button>
                    <Button
                      onClick={handleCancelarEdicion}
                      variant="outline"
                      className="border-slate-300"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="nombreNegocio" className="block text-sm font-medium text-slate-700 mb-2">
                        Nombre del Negocio
                      </label>
                      <Input
                        id="nombreNegocio"
                        value={editando ? datosEditados.nombre : negocio.nombre}
                        onChange={(e) =>
                          setDatosEditados({ ...datosEditados, nombre: e.target.value })
                        }
                        disabled={!editando}
                        className="border-slate-300"
                      />
                  </div>
                  <div>
                      <label htmlFor="categoria" className="block text-sm font-medium text-slate-700 mb-2">
                        Categoría
                      </label>
                      <Input
                        id="categoria"
                        value={editando ? datosEditados.categoria : negocio.categoria}
                        onChange={(e) =>
                          setDatosEditados({
                            ...datosEditados,
                            categoria: e.target.value,
                          })
                        }
                        disabled={!editando}
                        className="border-slate-300"
                      />
                  </div>
                </div>

                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-2">
                      Descripción
                    </label>
                    <Textarea
                      id="descripcion"
                      value={editando ? datosEditados.descripcion : negocio.descripcion}
                      onChange={(e) =>
                        setDatosEditados({
                          ...datosEditados,
                          descripcion: e.target.value,
                        })
                      }
                      disabled={!editando}
                      rows={3}
                      className="border-slate-300"
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="ciudad" className="block text-sm font-medium text-slate-700 mb-2">
                        Ciudad
                      </label>
                      <Input
                        id="ciudad"
                        value={editando ? datosEditados.ciudad : negocio.ciudad}
                        onChange={(e) =>
                          setDatosEditados({ ...datosEditados, ciudad: e.target.value })
                        }
                        disabled={!editando}
                        className="border-slate-300"
                      />
                  </div>
                  <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-2">
                        Teléfono
                      </label>
                      <Input
                        id="telefono"
                        value={editando ? datosEditados.telefono : negocio.telefono}
                        onChange={(e) =>
                          setDatosEditados({
                            ...datosEditados,
                            telefono: e.target.value,
                          })
                        }
                        disabled={!editando}
                        className="border-slate-300"
                      />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <Input
                        id="email"
                        value={editando ? datosEditados.email : negocio.email}
                        onChange={(e) =>
                          setDatosEditados({ ...datosEditados, email: e.target.value })
                        }
                        disabled={!editando}
                        type="email"
                        className="border-slate-300"
                      />
                  </div>
                  <div>
                      <label htmlFor="horario" className="block text-sm font-medium text-slate-700 mb-2">
                        Horario
                      </label>
                      <Input
                        id="horario"
                        value={editando ? datosEditados.horario : negocio.horario}
                        onChange={(e) =>
                          setDatosEditados({ ...datosEditados, horario: e.target.value })
                        }
                        disabled={!editando}
                        className="border-slate-300"
                      />
                  </div>
                </div>

                <div>
                  <label htmlFor="calificacion" className="block text-sm font-medium text-slate-700 mb-2">
                    Calificación
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-700">
                      {negocio.calificacion}
                    </span>
                    <span className="text-yellow-500">★★★★★</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ofertas" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-700">Mis Ofertas</h2>
                <p className="text-neutral-600">
                  Gestiona las ofertas que has enviado a los clientes
                </p>
              </div>
              <Button className="bg-slate-700 hover:bg-gray-700 text-white">
                Nueva Oferta
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {ofertas.map((oferta) => (
                <Card
                  key={oferta.id}
                  className="border-slate-200 hover:shadow-xl transition-shadow duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-slate-700 text-lg">
                        {oferta.solicitudTitulo}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={estadoColors[oferta.estado]}
                      >
                        {oferta.estado.charAt(0).toUpperCase() +
                          oferta.estado.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600 text-sm mb-4">
                      {oferta.mensaje}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-500">Precio:</span>
                        <span className="text-lg font-bold text-slate-700">
                          ${oferta.precio.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>Fecha:</span>
                        <span>{oferta.fechaCreacion}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Ver detalles
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {ofertas.length === 0 && (
              <div className="text-center py-16">
                <p className="text-neutral-500 text-lg mb-4">
                  No has enviado ofertas aún
                </p>
                <Button className="bg-slate-700 hover:bg-gray-700 text-white">
                  Explorar solicitudes
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
