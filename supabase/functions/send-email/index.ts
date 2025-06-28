/// <reference types="@supabase/functions" />
import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, subject, content } = await req.json() as {
      email: string;
      subject: string;
      content: string;
    };

    console.log("📥 Requête reçue pour envoi d’email :");
    console.log("   ➤ Destinataire :", email);
    console.log("   ➤ Sujet       :", subject);

    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const FROM_EMAIL = "socotaxi@gmail.com";

    if (!SENDGRID_API_KEY) {
      console.error("❌ Clé API SENDGRID manquante");
      return new Response("Clé API SENDGRID manquante", {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log("🔐 Clé SendGrid détectée :", SENDGRID_API_KEY.slice(0, 4) + "…");

    const payload = {
      personalizations: [{ to: [{ email }] }],
      from: { email: FROM_EMAIL },
      subject,
      content: [
        { type: "text/plain", value: content },
        { type: "text/html", value: content },
      ],
    };

    console.log("📤 Envoi de l’email en cours…");

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    console.log("📨 Réponse de SendGrid :", {
      status: response.status,
      body: responseText,
    });

    if (!response.ok) {
      console.error("❌ Échec de l’envoi :", response.status, responseText);

      // (optionnel) Sauvegarde dans email_queue (à activer si tu as une table)
      /*
      await fetch(Deno.env.get("SUPABASE_URL") + "/rest/v1/email_queue", {
        method: "POST",
        headers: {
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          subject,
          content,
          error: responseText,
        }),
      });
      */

      return new Response(`Erreur SendGrid: ${responseText}`, {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response("✅ Email envoyé avec succès", {
      status: 200,
      headers: corsHeaders,
    });

  } catch (e: unknown) {
    console.error("❌ Erreur interne :", e);
    return new Response(`Erreur serveur: ${(e as Error).message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
