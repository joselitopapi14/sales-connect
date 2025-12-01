-- Corregir la función de cálculo de similitud coseno
-- El problema: estaba dividiendo la distancia por 2, lo cual es incorrecto
-- La fórmula correcta es: similitud = 1 - distancia_coseno
-- donde distancia_coseno del operador <=> ya va de 0 a 2

create or replace function calcular_similitud_coseno(
  embedding_a vector(768),
  embedding_b vector(768)
)
returns float
language plpgsql
as $$
declare
  distancia float;
  similitud float;
begin
  -- Calcular distancia coseno usando el operador <=>
  -- El operador <=> retorna la distancia coseno: 0 = vectores idénticos, 2 = vectores opuestos
  distancia := embedding_a <=> embedding_b;
  
  -- Convertir distancia a similitud coseno
  -- Similitud = 1 - distancia_coseno
  -- Resultado: 1 = idénticos, 0 = sin relación, -1 = opuestos
  similitud := 1.0 - distancia;
  
  return similitud;
end;
$$;

comment on function calcular_similitud_coseno is 'Calcula la similitud coseno entre dos embeddings vectoriales. Retorna un valor de -1 (opuestos) a 1 (idénticos). La fórmula correcta es: similitud = 1 - distancia_coseno.';
