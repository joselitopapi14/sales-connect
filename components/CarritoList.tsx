"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Oferta {
  id: string;
  negocio_id: string;
  precio_ofertado: number;
  stock_disponible: number;
  mensaje: string | null;
  estado: string;
  created_at: string;
  negocios: {
    nombre: string;
    descripcion: string | null;
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

  const fetchCarrito = async () => {
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
  };

  useEffect(() => {
    fetchCarrito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

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
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">
                          {item.producto_descripcion}
                        </p>
                        <Badge variant="default" className="shrink-0">
                          Cantidad: {item.cantidad}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={estadoColors[item.estado] || estadoColors.pendiente}
                        >
                          {estadoLabels[item.estado] || item.estado}
                        </Badge>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              {item.ofertas.length > 0 
                                ? `Ver ${item.ofertas.length} ${item.ofertas.length === 1 ? "oferta" : "ofertas"}`
                                : "Ver ofertas"
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="end">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Ofertas recibidas</h4>
                              <Separator />
                              {item.ofertas.length > 0 ? (
                                <ScrollArea className="h-[300px] pr-4">
                                  <div className="space-y-3">
                                    {item.ofertas.map((oferta) => (
                                      <div
                                        key={oferta.id}
                                        className="p-3 rounded-lg border bg-card space-y-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <p className="font-semibold text-sm">
                                            {oferta.negocios.nombre}
                                          </p>
                                          <Badge variant="secondary" className="text-xs">
                                            ${oferta.precio_ofertado}
                                          </Badge>
                                        </div>
                                        
                                        {oferta.negocios.descripcion && (
                                          <p className="text-xs text-muted-foreground">
                                            {oferta.negocios.descripcion}
                                          </p>
                                        )}
                                        
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                          <span>Stock: {oferta.stock_disponible}</span>
                                          <span>
                                            {new Date(oferta.created_at).toLocaleDateString("es")}
                                          </span>
                                        </div>
                                        
                                        {oferta.mensaje && (
                                          <p className="text-xs border-l-2 border-primary pl-2 italic">
                                            {oferta.mensaje}
                                          </p>
                                        )}
                                        
                                        <Button size="sm" className="w-full">
                                          Seleccionar oferta
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                  <p className="text-sm text-muted-foreground">
                                    Aún no hay ofertas para este producto.
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Los negocios recibirán una notificación.
                                  </p>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
