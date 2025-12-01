const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    }
  }
);

const sql = fs.readFileSync('supabase/migrations/006_fix_negocio_catalogo_rls.sql', 'utf8');

async function applyMigration() {
  console.log('Aplicando migración 006...\n');
  
  // Ejecutar cada statement de DROP
  const dropStatements = [
    'drop policy if exists "Usuarios ven productos de ofertas que van a aceptar" on negocio_catalogo',
    'drop policy if exists "Usuarios ven ofertas de sus items del carrito" on ofertas',
    'drop policy if exists "Usuarios ven ofertas a sus items del carrito" on ofertas',
    'drop policy if exists "Usuarios pueden actualizar ofertas cuando las aceptan" on ofertas',
    'drop policy if exists "Usuarios pueden actualizar su carrito cuando aceptan ofertas" on carrito'
  ];
  
  for (const stmt of dropStatements) {
    console.log(`Ejecutando: ${stmt.substring(0, 80)}...`);
    const { error } = await supabase.rpc('query', { query: stmt });
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ OK');
    }
  }
  
  console.log('\n✅ Políticas antiguas eliminadas');
  console.log('\nAhora ve al SQL Editor de Supabase y ejecuta el resto del archivo 006_fix_negocio_catalogo_rls.sql');
  console.log('URL: https://supabase.com/dashboard/project/jzgfohebeyxnateifudp/sql/new');
}

applyMigration();
