"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { CATEGORIAS_NEGOCIO } from "@/lib/categorias";

interface CrearNegocioEmptyProps {
  onNegocioCreado: () => void;
}

export function CrearNegocioEmpty({ onNegocioCreado }: CrearNegocioEmptyProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_comercial: "",
    direccion: "",
    telefono: "",
    categoria: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre_comercial || !formData.direccion) {
      toast.error("Nombre comercial y dirección son requeridos");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/negocios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error creando negocio");
      }

      toast.success("¡Negocio creado exitosamente!");
      onNegocioCreado();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error creando negocio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center mt-20 justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl">Crea tu primer negocio</CardTitle>
          <CardDescription className="text-base">
            Aún no tienes un negocio registrado. Completa el formulario para comenzar a vender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre_comercial">
                Nombre del negocio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre_comercial"
                placeholder="Ej: Tienda de Tecnología"
                value={formData.nombre_comercial}
                onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">
                Dirección <span className="text-destructive">*</span>
              </Label>
              <Input
                id="direccion"
                placeholder="Ej: Calle Principal #123, Colonia Centro"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  placeholder="Ej: +52 55 1234 5678"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
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

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creando..." : "Crear mi negocio"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
