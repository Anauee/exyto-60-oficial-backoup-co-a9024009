
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fuyozchgyaoqdlfawdvi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eW96Y2hneWFvcWRsZmF3ZHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkzOTE4MywiZXhwIjoyMDc1NTE1MTgzfQ.QRA3VABqTQ6fO8rl7r-yW3HuRL1Y7qWCsczUVnkjzsA';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectDatabase() {
  console.log("Inspecting database structure...");
  
  // Get all tables in public schema
  const { data: tables, error: tablesError } = await supabase.rpc('get_tables_info');
  
  // Since we might not have the RPC, let's try a direct query to information_schema via a dynamic SQL if possible, 
  // or just check common names.
  
  const entities = ['tarefa', 'tarefas', 'fatura', 'faturas', 'projeto', 'projetos', 'cliente', 'clientes', 'produto', 'produtos'];
  
  for (const table of entities) {
    try {
      // Get columns for the table
      const { data: columns, error } = await supabase
        .from(table)
        .select('*')
        .limit(0); // Just to check if it exists and what headers we get
        
      if (error) {
        console.log(`Table ${table}: NOT FOUND or Error: ${error.message}`);
      } else {
        // Try to get one row to see actual data structure
        const { data: rows } = await supabase.from(table).select('*').limit(1);
        const colNames = rows && rows.length > 0 ? Object.keys(rows[0]) : "No rows to determine columns";
        console.log(`Table ${table}: EXISTS. Columns: ${JSON.stringify(colNames)}`);
      }
    } catch (e) {
      console.log(`Table ${table}: Exception: ${e.message}`);
    }
  }
}

inspectDatabase();
