"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Oferta = {
  id: string;
  cantidad_ofrecida: number;
  precio_unitario: number;
  precio_total: number;
  mensaje: string | null;
  similitud_score: number | null;
  estado: string;
  created_at: string;
  carrito: {
    id: string;
    producto_descripcion: string;
    cantidad: number;
    user_id: string;
    usuarios: {
      nombre_completo: string | null;
      email: string;
    } | null;
  };
};

interface OfertasListProps {
  negocioId: string;
}

const estadoColors: Record<string, string> = {
  enviada: "bg-blue-100 text-blue-800 border-blue-300",
  reservada: "bg-yellow-100 text-yellow-800 border-yellow-300",
  completada: "bg-green-100 text-green-800 border-green-300",
  rechazada: "bg-red-100 text-red-800 border-red-300",
  cancelada: "bg-gray-100 text-gray-800 border-gray-300",
};



export function OfertasList({ negocioId }: OfertasListProps) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [completandoId, setCompletandoId] = useState<string | null>(null);

  const cargarOfertas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/negocios/${negocioId}/ofertas`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando ofertas");
      }

      setOfertas(data.ofertas || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error cargando ofertas");
    } finally {
      setLoading(false);
    }
  }, [negocioId]);

  const completarCompra = async (ofertaId: string) => {
    setCompletandoId(ofertaId);
    try {
      const response = await fetch(
        `/api/negocios/${negocioId}/ofertas/${ofertaId}/completar`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error completando compra");
      }

      toast.success(data.message || "¡Compra completada exitosamente!");
      await cargarOfertas();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Error completando compra"
      );
    } finally {
      setCompletandoId(null);
    }
  };

  useEffect(() => {
    if (negocioId) {
      cargarOfertas();
    }
  }, [negocioId, cargarOfertas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ofertas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 text-lg mb-2">
          No has enviado ofertas aún
        </p>
        <p className="text-sm text-neutral-400">
          Las ofertas aparecerán aquí cuando los usuarios soliciten productos que coincidan con tu catálogo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        {ofertas.length} oferta{ofertas.length !== 1 ? "s" : ""} enviada{ofertas.length !== 1 ? "s" : ""}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {ofertas.map((oferta) => (
          <Card key={oferta.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-700 mb-1">
                      {oferta.carrito.producto_descripcion}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Cliente: {oferta.carrito.usuarios?.nombre_completo || oferta.carrito.usuarios?.email || "Usuario no disponible"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={estadoColors[oferta.estado] || ""}
                  >
                    {oferta.estado.charAt(0).toUpperCase() + oferta.estado.slice(1)}
                  </Badge>
                </div>

                {oferta.mensaje && (
                  <p className="text-sm text-neutral-600 italic border-l-2 border-slate-300 pl-3">
                    "{oferta.mensaje}"
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-neutral-500">Cantidad ofrecida</p>
                    <p className="text-lg font-semibold text-slate-700">
                      {oferta.cantidad_ofrecida}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-500">Precio total</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${oferta.precio_total.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t">
                  <span>Precio unitario: ${oferta.precio_unitario.toLocaleString("es-MX")}</span>
                  <span>{new Date(oferta.created_at).toLocaleDateString("es-MX")}</span>
                </div>

                {oferta.estado === "reservada" && (
                  <Button
                    className="w-full mt-2"
                    onClick={() => completarCompra(oferta.id)}
                    disabled={completandoId === oferta.id}
                  >
                    {completandoId === oferta.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Completando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Completar compra
                      </>
                    )}
                  </Button>
                )}

                {oferta.similitud_score && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                      <span>Similitud con solicitud</span>
                      <span className="font-medium">
                        {(oferta.similitud_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${oferta.similitud_score * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

