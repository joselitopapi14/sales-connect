    -- Función para calcular similitud coseno entre dos embeddings
    -- Similitud coseno = 1 - distancia_coseno
    -- En pgvector: embedding1 <=> embedding2 retorna la distancia coseno (0 a 2)
    -- Convertimos a similitud: 1 - (distancia / 2) para obtener un valor de 0 a 1

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
    distancia := embedding_a <=> embedding_b;
    
    -- Convertir distancia a similitud (0 = idénticos, 1 = similitud perfecta)
    -- La distancia coseno va de 0 (vectores idénticos) a 2 (vectores opuestos)
    -- Convertimos a similitud: 1 - (distancia / 2)
    similitud := 1.0 - (distancia / 2.0);
    
    return similitud;
    end;
    $$;

    -- Comentario
    comment on function calcular_similitud_coseno is 'Calcula la similitud coseno entre dos embeddings vectoriales. Retorna un valor de 0 (sin similitud) a 1 (idénticos).';
