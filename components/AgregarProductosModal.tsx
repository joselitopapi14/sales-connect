"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

type ProductoCatalogo = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string | null;
};

type ProductoSeleccionado = {
  producto_id: string;
  precio_negocio: number;
  stock_disponible: number;
  nombre_personalizado?: string;
};

interface AgregarProductosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negocioId: string;
  onProductosAgregados: () => void;
}

export function AgregarProductosModal({
  open,
  onOpenChange,
  negocioId,
  onProductosAgregados,
}: AgregarProductosModalProps) {
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<Map<string, ProductoSeleccionado>>(new Map());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const cargarProductos = async (pageNum: number, searchTerm: string, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: "100",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/catalogo?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando catálogo");
      }

      if (append) {
        setProductos((prev) => [...prev, ...(data.productos || [])]);
      } else {
        setProductos(data.productos || []);
      }

      setHasMore(data.hasMore || false);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error cargando catálogo");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPage(1);
      setSeleccionados(new Map());
      setBusqueda("");
      cargarProductos(1, "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        setPage(1);
        cargarProductos(1, busqueda, false);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      cargarProductos(nextPage, busqueda, true);
    }
  };

  const toggleProducto = (producto: ProductoCatalogo, checked: boolean) => {
    const nuevosSeleccionados = new Map(seleccionados);
    if (checked) {
      nuevosSeleccionados.set(producto.id, {
        producto_id: producto.id,
        precio_negocio: 0,
        stock_disponible: 0,
      });
    } else {
      nuevosSeleccionados.delete(producto.id);
    }
    setSeleccionados(nuevosSeleccionados);
  };

  const actualizarPrecio = (productoId: string, precio: number) => {
    const nuevosSeleccionados = new Map(seleccionados);
    const producto = nuevosSeleccionados.get(productoId);
    if (producto) {
      producto.precio_negocio = precio;
      nuevosSeleccionados.set(productoId, producto);
      setSeleccionados(nuevosSeleccionados);
    }
  };

  const actualizarStock = (productoId: string, stock: number) => {
    const nuevosSeleccionados = new Map(seleccionados);
    const producto = nuevosSeleccionados.get(productoId);
    if (producto) {
      producto.stock_disponible = stock;
      nuevosSeleccionados.set(productoId, producto);
      setSeleccionados(nuevosSeleccionados);
    }
  };

  const handleGuardar = async () => {
    if (seleccionados.size === 0) {
      toast.error("Selecciona al menos un producto");
      return;
    }

    // Validar que todos tengan precio mayor a 0
    const productosArray = Array.from(seleccionados.values());
    const sinPrecio = productosArray.filter((p) => p.precio_negocio <= 0);
    if (sinPrecio.length > 0) {
      toast.error("Todos los productos deben tener un precio mayor a 0");
      return;
    }

    try {
      setGuardando(true);
      const response = await fetch(`/api/negocios/${negocioId}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos: productosArray }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error agregando productos");
      }

      toast.success(`${productosArray.length} producto(s) agregado(s) exitosamente`);
      onProductosAgregados();
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error agregando productos");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Agregar Productos al Catálogo</DialogTitle>
          <DialogDescription>
            Selecciona productos del catálogo maestro y define su precio y stock
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-4">
                {productos.map((producto) => {
                  const isSelected = seleccionados.has(producto.id);
                  const datosProducto = seleccionados.get(producto.id);

                  return (
                    <div
                      key={producto.id}
                      className={`border rounded-lg p-4 space-y-3 transition-colors ${
                        isSelected ? "bg-slate-50 border-slate-300" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleProducto(producto, checked as boolean)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{producto.nombre}</p>
                              <p className="text-sm text-neutral-500">{producto.descripcion}</p>
                            </div>
                            {producto.categoria && (
                              <Badge variant="outline" className="text-xs">
                                {producto.categoria}
                              </Badge>
                            )}
                          </div>

                          {isSelected && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div className="space-y-1">
                                <Label htmlFor={`precio-${producto.id}`} className="text-xs">
                                  Precio <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`precio-${producto.id}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={datosProducto?.precio_negocio || ""}
                                  onChange={(e) =>
                                    actualizarPrecio(producto.id, parseFloat(e.target.value) || 0)
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`stock-${producto.id}`} className="text-xs">
                                  Stock Inicial
                                </Label>
                                <Input
                                  id={`stock-${producto.id}`}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={datosProducto?.stock_disponible || ""}
                                  onChange={(e) =>
                                    actualizarStock(producto.id, parseInt(e.target.value) || 0)
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {productos.length === 0 && !loading && (
                  <p className="text-center text-neutral-500 py-8">
                    No se encontraron productos
                  </p>
                )}

                {hasMore && productos.length > 0 && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        `Cargar más productos (${productos.length} de ${total})`
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm text-neutral-600">
              {seleccionados.size} producto{seleccionados.size !== 1 ? "s" : ""} seleccionado
              {seleccionados.size !== 1 ? "s" : ""}
            </p>
            {total > 0 && (
              <p className="text-xs text-neutral-500">
                Mostrando {productos.length} de {total} productos
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={guardando || seleccionados.size === 0}
            className="bg-slate-700 hover:bg-gray-700"
          >
            {guardando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Agregar productos"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
