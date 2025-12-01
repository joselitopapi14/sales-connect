"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrearNegocioEmpty } from "@/components/CrearNegocioEmpty";
import { ProductosDataTable } from "@/components/ProductosDataTable";
import { AgregarProductosModal } from "@/components/AgregarProductosModal";
import { OfertasList } from "@/components/OfertasList";
import { SolicitudesList } from "@/components/SolicitudesList";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CATEGORIAS_NEGOCIO } from "@/lib/categorias";

type Negocio = {
  id: string;
  nombre_comercial: string;
  direccion: string;
  telefono: string | null;
  categoria: string | null;
  activo: boolean;
  propietario_id: string;
  created_at: string;
  updated_at: string;
};

export default function NegocioPage() {
  const [loading, setLoading] = useState(true);
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [editando, setEditando] = useState(false);
  const [datosEditados, setDatosEditados] = useState<Negocio | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [modalProductosOpen, setModalProductosOpen] = useState(false);
  const [refreshProductos, setRefreshProductos] = useState(0);

  const cargarNegocio = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/negocios");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando negocio");
      }

      // Tomar el primer negocio (usuario solo puede tener uno)
      if (data.negocios && data.negocios.length > 0) {
        setNegocio(data.negocios[0]);
        setDatosEditados(data.negocios[0]);
      } else {
        setNegocio(null);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error cargando negocio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarNegocio();
  }, [cargarNegocio]);

  const handleGuardarCambios = async () => {
    if (!datosEditados || !negocio) return;

    try {
      setGuardando(true);
      const response = await fetch(`/api/negocios/${negocio.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_comercial: datosEditados.nombre_comercial,
          direccion: datosEditados.direccion,
          telefono: datosEditados.telefono,
          categoria: datosEditados.categoria,
          activo: datosEditados.activo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error actualizando negocio");
      }

      setNegocio(data.negocio);
      setDatosEditados(data.negocio);
      setEditando(false);
      toast.success("Negocio actualizado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error actualizando negocio");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelarEdicion = () => {
    setDatosEditados(negocio);
    setEditando(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si no hay negocio, mostrar Empty
  if (!negocio) {
    return <CrearNegocioEmpty onNegocioCreado={cargarNegocio} />;
  }

  return (
    <div className="min-h-screen mt-5 bg-linear-to-b from-white to-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-700 mb-2">Mi Negocio</h1>
        <p className="text-neutral-600 mb-8">
          Administra tu perfil, productos y ofertas
        </p>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl">
            <TabsTrigger value="perfil">Perfil del Negocio</TabsTrigger>
            <TabsTrigger value="productos">Mis Productos</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
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
                      disabled={guardando}
                    >
                      {guardando ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar"
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelarEdicion}
                      variant="outline"
                      className="border-slate-300"
                      disabled={guardando}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombreComercial">Nombre del Negocio</Label>
                  <Input
                    id="nombreComercial"
                    value={editando ? datosEditados?.nombre_comercial : negocio.nombre_comercial}
                    onChange={(e) =>
                      datosEditados &&
                      setDatosEditados({ ...datosEditados, nombre_comercial: e.target.value })
                    }
                    disabled={!editando}
                    className="border-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={
                      editando ? datosEditados?.direccion : negocio.direccion
                    }
                    onChange={(e) =>
                      datosEditados &&
                      setDatosEditados({
                        ...datosEditados,
                        direccion: e.target.value,
                      })
                    }
                    disabled={!editando}
                    className="border-slate-300"
                    placeholder="Calle Principal #123, Colonia Centro"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={
                        editando
                          ? datosEditados?.telefono || ""
                          : negocio.telefono || ""
                      }
                      onChange={(e) =>
                        datosEditados &&
                        setDatosEditados({
                          ...datosEditados,
                          telefono: e.target.value,
                        })
                      }
                      disabled={!editando}
                      className="border-slate-300"
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select
                      value={
                        editando
                          ? datosEditados?.categoria || ""
                          : negocio.categoria || ""
                      }
                      onValueChange={(value) =>
                        datosEditados &&
                        setDatosEditados({
                          ...datosEditados,
                          categoria: value,
                        })
                      }
                      disabled={!editando}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_NEGOCIO.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${negocio.activo ? "bg-green-500" : "bg-red-500"
                        }`}
                    />
                    <span className="text-sm text-neutral-600">
                      {negocio.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-neutral-500">
                    Creado: {new Date(negocio.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Última actualización:{" "}
                    {new Date(negocio.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="productos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mis Productos</CardTitle>
                <CardDescription>
                  Administra el catálogo de productos de tu negocio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductosDataTable
                  key={refreshProductos}
                  negocioId={negocio.id}
                  onAgregarProductos={() => setModalProductosOpen(true)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solicitudes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Clientes</CardTitle>
                <CardDescription>
                  Solicitudes que coinciden con tu catálogo (match ≥ 70%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SolicitudesList negocioId={negocio.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ofertas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mis Ofertas</CardTitle>
                <CardDescription>
                  Gestiona las ofertas que has enviado a los clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OfertasList negocioId={negocio.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AgregarProductosModal
          open={modalProductosOpen}
          onOpenChange={setModalProductosOpen}
          negocioId={negocio.id}
          onProductosAgregados={() => {
            setRefreshProductos((prev) => prev + 1);
            toast.success("Productos agregados exitosamente");
          }}
        />
      </div>
    </div>
  );
}
