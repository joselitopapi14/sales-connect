"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Match = {
  negocio_catalogo_id: string;
  producto_id: string;
  producto_nombre: string;
  producto_descripcion: string;
  precio_unitario: number;
  stock_disponible: number;
  similitud: number;
};

type Solicitud = {
  id: string;
  producto_descripcion: string;
  cantidad: number;
  estado: string;
  created_at: string;
  usuarios: {
    id: string;
    nombre_completo: string | null;
    email: string;
  } | null;
  matches: Match[];
  oferta_enviada: boolean;
  oferta_estado: string | null;
};

interface SolicitudesListProps {
  negocioId: string;
}

export function SolicitudesList({ negocioId }: SolicitudesListProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [cantidadOfrecida, setCantidadOfrecida] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/negocios/${negocioId}/solicitudes`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando solicitudes");
      }

      setSolicitudes(data.solicitudes || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error cargando solicitudes");
    } finally {
      setLoading(false);
    }
  }, [negocioId]);

  useEffect(() => {
    if (negocioId) {
      cargarSolicitudes();
    }
  }, [negocioId, cargarSolicitudes]);

  const abrirModalOferta = (solicitud: Solicitud, match: Match) => {
    setSelectedSolicitud(solicitud);
    setSelectedMatch(match);
    setCantidadOfrecida(solicitud.cantidad.toString());
    setPrecioUnitario(match.precio_unitario.toString());
    setMensaje("");
    setModalOpen(true);
  };

  const enviarOferta = async () => {
    if (!selectedSolicitud || !selectedMatch) return;

    const cantidad = parseInt(cantidadOfrecida);
    const precio = parseFloat(precioUnitario);

    if (!cantidad || cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (!precio || precio <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }

    if (cantidad > selectedMatch.stock_disponible) {
      toast.error(`Stock insuficiente. Disponible: ${selectedMatch.stock_disponible}`);
      return;
    }

    try {
      setEnviando(true);
      
      const requestBody = {
        negocio_catalogo_id: selectedMatch.negocio_catalogo_id,
        cantidad_ofrecida: cantidad,
        precio_unitario: precio,
        mensaje: mensaje.trim() || null,
        similitud_score: selectedMatch.similitud,
      };
      
      console.log("=== ENVIANDO OFERTA ===");
      console.log("URL:", `/api/negocios/${negocioId}/solicitudes/${selectedSolicitud.id}/ofertar`);
      console.log("Body:", requestBody);
      
      const response = await fetch(
        `/api/negocios/${negocioId}/solicitudes/${selectedSolicitud.id}/ofertar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        console.error("❌ Error response:", data);
        throw new Error(data.error || "Error enviando oferta");
      }

      toast.success("Oferta enviada exitosamente");
      setModalOpen(false);
      cargarSolicitudes(); // Recargar para actualizar estados
    } catch (error) {
      console.error("❌ Error completo:", error);
      toast.error(error instanceof Error ? error.message : "Error enviando oferta");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 text-lg mb-2">
          No hay solicitudes con match = 70%
        </p>
        <p className="text-sm text-neutral-400">
          Las solicitudes aparecerán aquí cuando haya productos que coincidan con tu catálogo
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">
          {solicitudes.length} solicitud{solicitudes.length !== 1 ? "es" : ""} con match
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {solicitudes.map((solicitud) => (
            <Card key={solicitud.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {solicitud.producto_descripcion}
                    </CardTitle>
                    <p className="text-sm text-neutral-500 mt-1">
                      Cliente: {solicitud.usuarios?.nombre_completo || solicitud.usuarios?.email || "Usuario desconocido"}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    Cantidad: {solicitud.cantidad}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-neutral-500">
                  Publicado: {new Date(solicitud.created_at).toLocaleDateString("es-MX")}
                </p>

                <div className="border-t pt-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Productos con match ({solicitud.matches.length})
                  </p>
                  <div className="space-y-2">
                    {solicitud.matches.slice(0, 3).map((match) => (
                      <div
                        key={match.negocio_catalogo_id}
                        className="flex items-start justify-between gap-2 p-2 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{match.producto_nombre}</p>
                          <p className="text-xs text-neutral-500">
                            Stock: {match.stock_disponible} | ${match.precio_unitario}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[100px]">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${match.similitud * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-neutral-500">
                              {(match.similitud * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        {!solicitud.oferta_enviada ? (
                          <Button
                            size="sm"
                            onClick={() => abrirModalOferta(solicitud, match)}
                            className="bg-slate-700 hover:bg-gray-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Enviada
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {solicitud.oferta_enviada && (
                  <div className="border-t pt-3">
                    <Badge variant="default" className="bg-green-600">
                      Ya enviaste una oferta para esta solicitud
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Oferta</DialogTitle>
            <DialogDescription>
              Completa los detalles de tu oferta para esta solicitud
            </DialogDescription>
          </DialogHeader>

          {selectedSolicitud && selectedMatch && (
            <div className="space-y-4">
              <div className="border rounded-lg p-3 bg-slate-50">
                <p className="text-sm font-medium text-slate-700">Solicitud del cliente</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {selectedSolicitud.producto_descripcion}
                </p>
                <p className="text-xs text-neutral-500">
                  Cantidad solicitada: {selectedSolicitud.cantidad}
                </p>
              </div>

              <div className="border rounded-lg p-3 bg-blue-50">
                <p className="text-sm font-medium text-slate-700">Tu producto</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {selectedMatch.producto_nombre}
                </p>
                <p className="text-xs text-neutral-500">
                  Match: {(selectedMatch.similitud * 100).toFixed(0)}% | Stock disponible: {selectedMatch.stock_disponible}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad a ofrecer</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    max={selectedMatch.stock_disponible}
                    value={cantidadOfrecida}
                    onChange={(e) => setCantidadOfrecida(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio unitario</Label>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioUnitario}
                    onChange={(e) => setPrecioUnitario(e.target.value)}
                  />
                </div>
              </div>

              {cantidadOfrecida && precioUnitario && (
                <div className="border rounded-lg p-3 bg-green-50">
                  <p className="text-sm font-medium text-slate-700">
                    Precio total: ${(parseInt(cantidadOfrecida) * parseFloat(precioUnitario)).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="mensaje">Mensaje (opcional)</Label>
                <Textarea
                  id="mensaje"
                  placeholder="Agrega un mensaje para el cliente..."
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button
              onClick={enviarOferta}
              disabled={enviando}
              className="bg-slate-700 hover:bg-gray-700"
            >
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar oferta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
