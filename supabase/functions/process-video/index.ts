import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Corps de requête invalide (JSON)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventId = body.eventId || new URL(req.url).searchParams.get("eventId");

  if (!eventId) {
    return new Response(JSON.stringify({ error: "eventId requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 🔁 URL de ton API Node.js hébergée sur Vercel
  const webhookURL = `https://gregaplay.vercel.app/api/process-video?eventId=${eventId}`;

  try {
    const response = await fetch(webhookURL, { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Erreur lors de l’appel à Vercel");
    }

    return new Response(JSON.stringify({ success: true, ...data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erreur déclenchement traitement vidéo", details: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
