"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { ArrowRightIcon, LoaderIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface InputGroupRequestProps {
  onSuccess?: () => void;
}

export function InputGroupRequest({ onSuccess }: InputGroupRequestProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error("Por favor escribe lo que necesitas");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/solicitudes/procesar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error procesando solicitud");
      }

      toast.success(data.mensaje);
      setInput(""); // Limpiar el input
      onSuccess?.(); // Llamar callback para refrescar lista
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo procesar tu solicitud"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="grid w-full max-w-sm gap-6">
      <InputGroup>
        <InputGroupTextarea
          placeholder="Ej: 3 camisas polo verdes, 4 zapatos nike talla 40..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton
            variant="outline"
            className="rounded-full"
            size="icon-xs"
            disabled={isLoading}
          >
            <IconPlus />
          </InputGroupButton>
          <InputGroupText className="ml-auto">Powered by Gemini</InputGroupText>
          <Separator orientation="vertical" className="h-4!" />
          <InputGroupButton
            variant="default"
            className="rounded-full"
            size="icon-xs"
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <ArrowRightIcon />
            )}
            <span className="sr-only">Send</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
