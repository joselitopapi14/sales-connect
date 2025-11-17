"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface CarritoItem {
  id: string;
  producto_descripcion: string;
  cantidad: number;
  estado: string;
  created_at: string;
  ofertas: { count: number }[];
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
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCarrito = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/carrito");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error obteniendo carrito");
      }

      setCarrito(data.carrito);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={`skeleton-${i}`}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (carrito.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground text-lg">
            No tienes solicitudes en tu carrito
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Usa el campo de arriba para agregar productos o servicios
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {carrito.map((item) => {
        const ofertasCount = item.ofertas?.[0]?.count || 0;
        
        return (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-2">
                  {item.producto_descripcion}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={estadoColors[item.estado] || ""}
                >
                  {estadoLabels[item.estado] || item.estado}
                </Badge>
              </div>
              <CardDescription>
                Cantidad: {item.cantidad}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {ofertasCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {ofertasCount} {ofertasCount === 1 ? "oferta" : "ofertas"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
