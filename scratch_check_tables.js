
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fuyozchgyaoqdlfawdvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eW96Y2hneWFvcWRsZmF3ZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MzkxODMsImV4cCI6MjA3NTUxNTE4M30.QPYSCVA3JiJdbMzoAKmn59Fe176674RMQf1AIBjmVgI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  const tables = [
    'tarefas', 'projetos', 'faturas', 'despesas', 'clientes', 'produtos', 
    'post', 'membro', 'usuario_empresa', 'empresas', 'users'
  ];
  
  console.log("Checking tables existence and RLS...");
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`Table ${table}: OK (Found ${data.length} rows)`);
      }
    } catch (e) {
      console.log(`Table ${table}: EXCEPTION - ${e.message}`);
    }
  }
}

listTables();
