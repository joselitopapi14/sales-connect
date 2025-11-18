import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Usar gemini-1.5-flash que tiene mejor cuota en el tier gratuito
export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash" 
});

export const embeddingModel = genAI.getGenerativeModel({ 
  model: "text-embedding-004" 
});

export interface ProductoFraccionado {
  descripcion: string;
  cantidad: number;
}

/**
 * Fracciona un input de texto en productos individuales con sus cantidades
 * Ejemplo: "3 camisas polo verdes, 4 zapatos nike talla 40" 
 * -> [{ descripcion: "camisa polo verde", cantidad: 3 }, { descripcion: "zapatos nike talla 40", cantidad: 4 }]
 */
export async function fraccionarSolicitud(input: string): Promise<ProductoFraccionado[]> {
  const prompt = `Analiza el siguiente texto y extrae todos los productos o servicios solicitados.
Para cada producto, identifica:
1. La descripción del producto (sin la cantidad)
2. La cantidad solicitada (si no se especifica, asume 1)

Devuelve SOLO un array JSON válido, sin texto adicional, markdown o explicaciones.
El formato debe ser: [{"descripcion": "...", "cantidad": numero}, ...]

Texto a analizar: "${input}"

Ejemplos:
- "3 camisas polo verdes" -> [{"descripcion": "camisa polo verde", "cantidad": 3}]
- "2 laptops HP y 1 mouse inalámbrico" -> [{"descripcion": "laptop HP", "cantidad": 2}, {"descripcion": "mouse inalámbrico", "cantidad": 1}]`;

  const result = await geminiModel.generateContent(prompt);
  const response = result.response.text();
  
  // Limpiar la respuesta de markdown y texto extra
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No se pudo extraer JSON válido de la respuesta de Gemini");
  }
  
  const productos = JSON.parse(jsonMatch[0]) as ProductoFraccionado[];
  
  if (!Array.isArray(productos) || productos.length === 0) {
    throw new Error("La respuesta no contiene productos válidos");
  }
  
  return productos;
}

/**
 * Genera un embedding vectorial para un texto usando Gemini
 */
export async function generarEmbedding(texto: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(texto);
  return result.embedding.values;
}
