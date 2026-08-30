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

    const { image, locale = "he" } = await req.json();
    const openAiKey = Deno.env.get("OPENAI_API_KEY");

    let result = {
      dishName: locale === "he" ? "ארוחה" : "Meal",
      calories: 400,
      proteinG: 15,
      fatG: 20,
      carbsG: 30,
      insight:
        locale === "he"
          ? "ארוחה בינונית — ייתכן השפעה על שינה ו-HRV."
          : "Medium meal — may affect sleep and HRV.",
    };

    if (openAiKey && image) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    locale === "he"
                      ? 'נתחי את הארוחה בתמונה. החזירי JSON בלבד: {"dishName","calories","proteinG","fatG","carbsG","insight"} — insight בעברית, הקשר בריאותי קצר.'
                      : 'Analyze this meal photo. Return JSON only: {"dishName","calories","proteinG","fatG","carbsG","insight"} — short wellness context.',
                },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      const json = await res.json();
      const raw = json.choices?.[0]?.message?.content ?? "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) result = { ...result, ...JSON.parse(match[0]) };
    }

    await supabase.from("meals").insert({
      user_id: user.id,
      dish_name: result.dishName,
      calories: result.calories,
      protein_g: result.proteinG,
      fat_g: result.fatG,
      carbs_g: result.carbsG,
      insight: result.insight,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
