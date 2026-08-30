import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    const { message, locale = "he", context } = await req.json();
    const openAiKey = Deno.env.get("OPENAI_API_KEY");

    let reply: string;

    if (openAiKey) {
      const system =
        locale === "he"
          ? "את NOVA — עוזרת בריאות אישית. הסבירי בקצרה, בעברית, על בסיס נתוני המשתמש. לא אבחון רפואי. הימנעי מהתרעות מיותרות."
          : "You are NOVA — a personal wellness assistant. Explain briefly using user context. Not medical diagnosis. Avoid unnecessary alerts.";

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system + (context?.metricsSummary ? `\nContext: ${context.metricsSummary}` : "") },
            { role: "user", content: message },
          ],
          max_tokens: 400,
        }),
      });

      const json = await res.json();
      reply = json.choices?.[0]?.message?.content ?? "NOVA is thinking…";
    } else {
      reply =
        locale === "he"
          ? "על בסיס הנתונים שלך: שינה מתחת לבסיס, HRV ירד מעט, וארוחת ערב כבדה אתמול. נסי 3 דקות נשימות ושינה מוקדמת."
          : "Based on your data: sleep below baseline, HRV dipped slightly, heavier dinner logged. Try 3 min breathing and earlier sleep.";
    }

    await supabase.from("chat_messages").insert([
      { user_id: user.id, role: "user", content: message },
      { user_id: user.id, role: "assistant", content: reply },
    ]);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
