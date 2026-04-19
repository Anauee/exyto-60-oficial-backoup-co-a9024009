import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const webhookId = url.searchParams.get("id");

  console.log(`Receiving request for path: ${path}, ID: ${webhookId}`);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const headers = Object.fromEntries(req.headers.entries());
    const method = req.method;

    // 1. RECEPTOR DE TESTES
    if (path.includes("/test")) {
      const testUrlId = webhookId;
      if (!testUrlId) return new Response("Missing test ID", { status: 400 });

      // Extract empresa_id from testUrlId (format: empresaId_timestamp_random)
      const empresaId = testUrlId.split("_")[0];

      const { error } = await supabase.from("test_webhook_log").insert({
        empresa_id: empresaId,
        test_url_id: testUrlId,
        request_method: method,
        request_headers: headers,
        request_body: body,
        request_query_params: Object.fromEntries(url.searchParams.entries()),
        ip_address: headers["x-real-ip"] || "unknown",
        timestamp: new Date().toISOString()
      });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: "Test log saved" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. WEBHOOK DE ENTRADA (PRODUÇÃO)
    if (path.includes("/inbound")) {
      if (!webhookId) return new Response("Missing webhook ID", { status: 400 });

      // Load config
      const { data: config, error: configError } = await supabase
        .from("webhook_config")
        .select("*")
        .eq("id", webhookId)
        .single();

      if (configError || !config) {
        return new Response("Webhook not found", { status: 404 });
      }

      if (config.status !== 'ativo') {
        return new Response("Webhook inactive", { status: 403 });
      }

      // Record log
      await supabase.from("webhook_log").insert({
        webhook_id: webhookId,
        empresa_id: config.empresa_id,
        request_method: method,
        request_headers: headers,
        request_body: body,
        status: "recebido",
        timestamp: new Date().toISOString()
      });

      // Execute Workflow
      const workflow = config.inbound_workflow;
      const steps = workflow?.steps || [];
      const results = [];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const result = await executeStep(supabase, step, body, results, config.empresa_id);
        results.push(result);
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. WEBHOOK DE SAÍDA (GATILHOS DO BANCO)
    if (path.includes("/outbound")) {
      const eventName = body.event;
      if (!eventName) return new Response("Missing event name", { status: 400 });

      const empresaId = body.record?.empresa_id || body.old_record?.empresa_id;
      if (!empresaId) return new Response("Missing empresa ID", { status: 400 });

      // Find all matching outbound webhooks
      const { data: configs, error: configsError } = await supabase
        .from("webhook_config")
        .select("*")
        .eq("tipo", "saida")
        .eq("event_trigger", eventName)
        .eq("status", "ativo")
        .eq("empresa_id", empresaId);

      if (configsError) throw configsError;

      const results = [];
      for (const config of (configs || [])) {
        try {
          // Send to target_url
          const response = await fetch(config.target_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: eventName,
              data: body.record || body.old_record,
              timestamp: new Date().toISOString()
            })
          });

          // Log the attempt
          await supabase.from("webhook_log").insert({
            webhook_id: config.id,
            empresa_id: config.empresa_id,
            request_method: "POST",
            request_headers: { "Content-Type": "application/json" },
            request_body: body,
            response_status: response.status,
            status: response.ok ? "sucesso" : "erro",
            timestamp: new Date().toISOString()
          });

          results.push({ id: config.id, status: response.status });
        } catch (err) {
          console.error(`Error sending to ${config.target_url}:`, err);
          results.push({ id: config.id, error: err.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

async function executeStep(supabase: any, step: any, originalPayload: any, previousResults: any[], empresaId: string) {
  const { action, field_mapping, lookup_field } = step;
  
  // Resolve placeholders
  const resolvedData = resolvePlaceholders(field_mapping, originalPayload, previousResults);
  resolvedData.empresa_id = empresaId;

  const entityName = action.split("_")[1].toLowerCase();
  const operation = action.split("_")[0]; // create, update, delete

  console.log(`Executing ${operation} on ${entityName}`);

  if (operation === "create") {
    const { data, error } = await supabase.from(entityName).insert(resolvedData).select().single();
    if (error) throw error;
    return data;
  }

  if (operation === "update") {
    if (!lookup_field || !resolvedData[lookup_field]) {
      throw new Error(`Lookup field ${lookup_field} missing for update`);
    }
    const { data, error } = await supabase
      .from(entityName)
      .update(resolvedData)
      .eq(lookup_field, resolvedData[lookup_field])
      .eq("empresa_id", empresaId) // Security
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  if (operation === "delete") {
    if (!lookup_field || !resolvedData[lookup_field]) {
      throw new Error(`Lookup field ${lookup_field} missing for delete`);
    }
    const { error } = await supabase
      .from(entityName)
      .delete()
      .eq(lookup_field, resolvedData[lookup_field])
      .eq("empresa_id", empresaId);
    if (error) throw error;
    return { success: true };
  }

  return { message: "Unknown action" };
}

function resolvePlaceholders(mapping: any, payload: any, results: any[]) {
  const resolved = { ...mapping };
  
  for (const key in resolved) {
    let value = resolved[key];
    if (typeof value === "string") {
      // Replace {{original_payload.path}}
      value = value.replace(/\{\{original_payload\.(.*?)\}\}/g, (_, path) => {
        return getPath(payload, path) || "";
      });
      
      // Replace {{step_N.path}}
      value = value.replace(/\{\{step_(\d+)\.(.*?)\}\}/g, (_, stepIdx, path) => {
        const stepData = results[parseInt(stepIdx) - 1];
        return getPath(stepData, path) || "";
      });
    }
    resolved[key] = value;
  }
  
  return resolved;
}

function getPath(obj: any, path: string) {
  return path.split(".").reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
}
