"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, Banknote } from "lucide-react";
import { toast } from "sonner";

type PagoEfectivo = {
  id: string;
  monto: number;
  estado: string;
  created_at: string;
  confirmado_por_negocio: boolean;
  oferta_id: string;
  carrito: {
    producto_descripcion: string;
    cantidad: number;
    usuarios: {
      nombre_completo: string | null;
      email: string;
    } | null;
  };
  ofertas: {
    cantidad_ofrecida: number;
    precio_unitario: number;
  };
};

interface PagosEfectivoListProps {
  negocioId: string;
}

export function PagosEfectivoList({ negocioId }: PagosEfectivoListProps) {
  const [pagos, setPagos] = useState<PagoEfectivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const cargarPagos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/negocios/${negocioId}/pagos-efectivo`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando pagos");
      }

      setPagos(data.pagos || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error cargando pagos");
    } finally {
      setLoading(false);
    }
  }, [negocioId]);

  useEffect(() => {
    if (negocioId) {
      cargarPagos();
    }
  }, [negocioId, cargarPagos]);

  const confirmarPago = async (pagoId: string) => {
    setConfirmandoId(pagoId);
    try {
      const response = await fetch("/api/pagos/confirmar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pago_id: pagoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error confirmando pago");
      }

      toast.success("Pago confirmado. Stock actualizado correctamente");
      await cargarPagos();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo confirmar el pago"
      );
    } finally {
      setConfirmandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pagos.length === 0) {
    return (
      <div className="text-center py-12">
        <Banknote className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
        <p className="text-neutral-500 text-lg mb-2">
          No hay pagos en efectivo pendientes
        </p>
        <p className="text-sm text-neutral-400">
          Los pagos en efectivo pendientes de confirmación aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {pagos.filter(p => !p.confirmado_por_negocio).length} pago{pagos.filter(p => !p.confirmado_por_negocio).length !== 1 ? "s" : ""} pendiente{pagos.filter(p => !p.confirmado_por_negocio).length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pagos.map((pago) => (
          <Card 
            key={pago.id} 
            className={`hover:shadow-lg transition-shadow ${
              pago.confirmado_por_negocio ? "opacity-60" : ""
            }`}
          >
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Banknote className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-slate-700">
                        {pago.carrito.producto_descripcion}
                      </h3>
                    </div>
                    <p className="text-sm text-neutral-500">
                      Cliente: {pago.carrito.usuarios?.nombre_completo || pago.carrito.usuarios?.email || "Usuario no disponible"}
                    </p>
                  </div>
                  {pago.confirmado_por_negocio ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Confirmado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Pendiente
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-neutral-500">Cantidad</p>
                    <p className="text-lg font-semibold text-slate-700">
                      {pago.ofertas.cantidad_ofrecida}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-500">Total a recibir</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${pago.monto.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t">
                  <span>Precio unitario: ${pago.ofertas.precio_unitario.toLocaleString("es-MX")}</span>
                  <span>{new Date(pago.created_at).toLocaleDateString("es-MX")}</span>
                </div>

                {!pago.confirmado_por_negocio && (
                  <Button
                    onClick={() => confirmarPago(pago.id)}
                    disabled={confirmandoId === pago.id}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {confirmandoId === pago.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirmar pago recibido
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
