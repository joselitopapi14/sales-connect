"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowUpDown, Store, Trash2, Loader2, CreditCard, Banknote } from "lucide-react";

interface Oferta {
  id: string;
  negocio_id: string;
  cantidad_ofrecida: number;
  precio_unitario: number;
  precio_total: number;
  mensaje: string | null;
  similitud_score: number | null;
  estado: string;
  created_at: string;
  negocios: {
    nombre_comercial: string;
    direccion: string;
    telefono: string | null;
  };
}

interface CarritoItem {
  id: string;
  producto_descripcion: string;
  cantidad: number;
  estado: string;
  created_at: string;
  ofertas: Oferta[];
}

interface Solicitud {
  solicitud_id: string;
  created_at: string;
  items: CarritoItem[];
}

interface CarritoListProps {
  refreshTrigger?: number;
}

const estadoColors: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  con_ofertas: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  reservado: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  completado: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  cancelado: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
};

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  con_ofertas: "Con Ofertas",
  reservado: "Reservado",
  completado: "Completado",
  cancelado: "Cancelado",
};

export function CarritoList({ refreshTrigger }: CarritoListProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordenOfertasPor, setOrdenOfertasPor] = useState<Record<string, string>>({});
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [aceptandoId, setAceptandoId] = useState<string | null>(null);
  const [dialogPagoAbierto, setDialogPagoAbierto] = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<{ ofertaId: string; carritoId: string } | null>(null);
  const [metodoPago, setMetodoPago] = useState<string>("tarjeta");
  const [ofertasPorItem, setOfertasPorItem] = useState<Record<string, Oferta[]>>({});
  const [cargandoOfertas, setCargandoOfertas] = useState<Record<string, boolean>>({});

  const fetchCarrito = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/carrito");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error obteniendo carrito");
      }

      setSolicitudes(data.solicitudes);
    } catch (error) {
      console.error("Error:", error);
      toast.error("No se pudo cargar tu carrito");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOfertasItem = useCallback(async (carritoId: string) => {
    try {
      setCargandoOfertas(prev => ({ ...prev, [carritoId]: true }));
      const response = await fetch(`/api/carrito/${carritoId}/ofertas`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error obteniendo ofertas");
      }

      setOfertasPorItem(prev => ({ ...prev, [carritoId]: data.ofertas || [] }));
    } catch (error) {
      console.error("Error:", error);
      toast.error("No se pudieron cargar las ofertas");
    } finally {
      setCargandoOfertas(prev => ({ ...prev, [carritoId]: false }));
    }
  }, []);

  useEffect(() => {
    fetchCarrito();
  }, [refreshTrigger, fetchCarrito]);

  const ordenarOfertas = (ofertas: Oferta[], orden: string) => {
    const ofertasOrdenadas = [...ofertas];
    switch (orden) {
      case "precio_asc":
        return ofertasOrdenadas.sort((a, b) => a.precio_total - b.precio_total);
      case "precio_desc":
        return ofertasOrdenadas.sort((a, b) => b.precio_total - a.precio_total);
      case "similitud":
        return ofertasOrdenadas.sort((a, b) => (b.similitud_score || 0) - (a.similitud_score || 0));
      case "reciente":
        return ofertasOrdenadas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      default:
        return ofertasOrdenadas;
    }
  };

  const eliminarItem = async (carritoId: string) => {
    setEliminandoId(carritoId);
    try {
      const response = await fetch(`/api/carrito?id=${carritoId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error eliminando producto");
      }

      toast.success("Producto eliminado del carrito");
      await fetchCarrito();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el producto"
      );
    } finally {
      setEliminandoId(null);
    }
  };

  const abrirDialogPago = (ofertaId: string, carritoId: string) => {
    setOfertaSeleccionada({ ofertaId, carritoId });
    setDialogPagoAbierto(true);
  };

  const aceptarOferta = async () => {
    if (!ofertaSeleccionada) return;

    setAceptandoId(ofertaSeleccionada.ofertaId);
    try {
      const response = await fetch("/api/carrito/aceptar-oferta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oferta_id: ofertaSeleccionada.ofertaId,
          carrito_id: ofertaSeleccionada.carritoId,
          metodo_pago: metodoPago,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error aceptando oferta");
      }

      toast.success(data.message || "¡Oferta aceptada!");
      setDialogPagoAbierto(false);
      setOfertaSeleccionada(null);
      setMetodoPago("tarjeta");
      await fetchCarrito();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo aceptar la oferta"
      );
    } finally {
      setAceptandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(3)].map((_, i) => (
          <Card key={`skeleton-${i}-${Date.now()}`}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            No tienes solicitudes aún. Usa el formulario arriba para agregar productos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-4">
      {solicitudes.map((solicitud) => {
        const fecha = new Date(solicitud.created_at).toLocaleString("es", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <Card key={solicitud.solicitud_id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardDescription>{fecha}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {solicitud.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">
                          {item.producto_descripcion}
                        </p>
                        <Badge variant="default" className="shrink-0">
                          Cantidad: {item.cantidad}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={estadoColors[item.estado] || estadoColors.pendiente}
                        >
                          {estadoLabels[item.estado] || item.estado}
                        </Badge>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => fetchOfertasItem(item.id)}
                            >
                              {(() => {
                                const ofertas = ofertasPorItem[item.id] || [];
                                return ofertas.length > 0 
                                  ? `Ver ${ofertas.length} ${ofertas.length === 1 ? "oferta" : "ofertas"}`
                                  : "Ver ofertas";
                              })()}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px]" align="start" side="bottom" sideOffset={5}>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm flex items-center gap-1.5">
                                  <Store className="h-3.5 w-3.5" />
                                  Ofertas
                                </h4>
                                {(() => {
                                  const ofertas = ofertasPorItem[item.id] || [];
                                  return ofertas.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {ofertas.length}
                                    </Badge>
                                  );
                                })()}
                              </div>
                              <Separator className="my-2" />
                              
                              {cargandoOfertas[item.id] ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                              ) : (ofertasPorItem[item.id] || []).length > 0 ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
                                    <Select
                                      value={ordenOfertasPor[item.id] || "precio_asc"}
                                      onValueChange={(value) => 
                                        setOrdenOfertasPor({ ...ordenOfertasPor, [item.id]: value })
                                      }
                                    >
                                      <SelectTrigger className="h-7 text-xs">
                                        <SelectValue placeholder="Ordenar" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="precio_asc">💰 Menor precio</SelectItem>
                                        <SelectItem value="precio_desc">💰 Mayor precio</SelectItem>
                                        <SelectItem value="similitud">🎯 Mejor match</SelectItem>
                                        <SelectItem value="reciente">🕐 Reciente</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <ScrollArea className="h-[280px] pr-3">
                                    <div className="space-y-2">
                                      {ordenarOfertas(ofertasPorItem[item.id] || [], ordenOfertasPor[item.id] || "precio_asc").map((oferta) => (
                                        <div
                                          key={oferta.id}
                                          className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors space-y-2"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                              <p className="font-semibold text-xs truncate">
                                                {oferta.negocios.nombre_comercial}
                                              </p>
                                              <p className="text-[10px] text-muted-foreground truncate">
                                                {oferta.negocios.direccion}
                                              </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                              <Badge variant="default" className="text-xs font-bold">
                                                ${oferta.precio_total.toFixed(2)}
                                              </Badge>
                                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                                ${oferta.precio_unitario.toFixed(2)} c/u
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1.5 text-[10px]">
                                            <div className="bg-muted/50 px-2 py-1 rounded flex-1">
                                              <span className="text-muted-foreground">Cant:</span>
                                              <span className="font-medium ml-1">{oferta.cantidad_ofrecida}</span>
                                            </div>
                                            {oferta.similitud_score && (
                                              <div className="bg-blue-50 px-2 py-1 rounded flex-1">
                                                <span className="text-muted-foreground">Match:</span>
                                                <span className="font-medium ml-1 text-blue-600">
                                                  {(oferta.similitud_score * 100).toFixed(0)}%
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {oferta.mensaje && (
                                            <p className="text-[10px] border-l-2 border-primary pl-2 italic bg-primary/5 py-1 line-clamp-2">
                                              "{oferta.mensaje}"
                                            </p>
                                          )}

                                          <div className="flex items-center justify-between pt-1 border-t">
                                            <span className="text-[10px] text-muted-foreground">
                                              {new Date(oferta.created_at).toLocaleDateString("es-MX", {
                                                day: "2-digit",
                                                month: "short",
                                              })}
                                            </span>
                                            <Button
                                              size="sm"
                                              className="h-6 text-xs px-3 bg-slate-700 hover:bg-gray-700"
                                              onClick={() => abrirDialogPago(oferta.id, item.id)}
                                              disabled={
                                                aceptandoId === oferta.id || 
                                                ["reservado", "completado"].includes(item.estado) ||
                                                oferta.estado === "reservada"
                                              }
                                            >
                                              {aceptandoId === oferta.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : oferta.estado === "reservada" ? (
                                                "✓ Aceptada"
                                              ) : (
                                                "Seleccionar"
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                  <p className="text-xs text-muted-foreground">
                                    Aún no hay ofertas para este producto.
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    Los negocios recibirán notificación.
                                  </p>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => eliminarItem(item.id)}
                          disabled={eliminandoId === item.id || ["reservado", "completado"].includes(item.estado)}
                        >
                          {eliminandoId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Dialog para seleccionar método de pago */}
      <Dialog open={dialogPagoAbierto} onOpenChange={setDialogPagoAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecciona el método de pago</DialogTitle>
            <DialogDescription>
              Elige cómo deseas pagar por este producto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <RadioGroup value={metodoPago} onValueChange={setMetodoPago}>
              <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="tarjeta" id="tarjeta" />
                <Label htmlFor="tarjeta" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium">Pago con tarjeta</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El pago se procesa inmediatamente y el producto se reserva automáticamente. El stock se actualiza al instante.
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="efectivo" id="efectivo" />
                <Label htmlFor="efectivo" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="h-4 w-4" />
                    <span className="font-medium">Pago en efectivo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El producto se reserva temporalmente. Paga directamente en el negocio. El stock se actualiza al confirmar el pago.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogPagoAbierto(false);
                setOfertaSeleccionada(null);
              }}
              disabled={aceptandoId !== null}
            >
              Cancelar
            </Button>
            <Button
              onClick={aceptarOferta}
              disabled={aceptandoId !== null}
            >
              {aceptandoId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>Confirmar pago</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
