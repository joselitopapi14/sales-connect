"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type ProductoNegocio = {
  id: string;
  negocio_id: string;
  producto_id: string;
  precio_negocio: number;
  nombre_personalizado: string | null;
  stock_disponible: number;
  activo: boolean;
  catalogo_maestro: {
    id: string;
    nombre: string;
    descripcion: string;
    categoria: string | null;
  };
};

interface ProductosDataTableProps {
  negocioId: string;
  onAgregarProductos: () => void;
}

export function ProductosDataTable({ negocioId, onAgregarProductos }: ProductosDataTableProps) {
  const [productos, setProductos] = useState<ProductoNegocio[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/negocios/${negocioId}/productos`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error cargando productos");
      }

      setProductos(data.productos || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }, [negocioId]);

  useEffect(() => {
    if (negocioId) {
      cargarProductos();
    }
  }, [negocioId, cargarProductos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 text-lg mb-4">
          No tienes productos en tu catálogo aún
        </p>
        <Button onClick={onAgregarProductos} className="bg-slate-700 hover:bg-gray-700">
          <Plus className="mr-2 h-4 w-4" />
          Agregar productos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500">
          {productos.length} producto{productos.length !== 1 ? "s" : ""} en tu catálogo
        </p>
        <Button onClick={onAgregarProductos} className="bg-slate-700 hover:bg-gray-700">
          <Plus className="mr-2 h-4 w-4" />
          Agregar productos
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {producto.nombre_personalizado || producto.catalogo_maestro.nombre}
                    </p>
                    <p className="text-sm text-neutral-500 line-clamp-1">
                      {producto.catalogo_maestro.descripcion}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {producto.catalogo_maestro.categoria || "Sin categoría"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${producto.precio_negocio.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <span className={producto.stock_disponible > 0 ? "text-green-600" : "text-red-600"}>
                    {producto.stock_disponible}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={producto.activo ? "default" : "secondary"}>
                    {producto.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
