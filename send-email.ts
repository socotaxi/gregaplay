// send-email.ts
import { serve } from "https://deno.land/std/http/server.ts";
import "https://deno.land/std/dotenv/load.ts"; // Charge le .env automatiquement

const PORT = 8787;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const { email, subject, content } = await req.json();

    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const FROM_EMAIL = "socotaxi@gmail.com";

    if (!SENDGRID_API_KEY) {
      console.error("❌ Clé API SendGrid manquante");
      return new Response("Clé API manquante", { status: 500 });
    }

    const payload = {
      personalizations: [{ to: [{ email }] }],
      from: { email: FROM_EMAIL },
      subject,
      content: [
        { type: "text/plain", value: content },
        { type: "text/html", value: content },
      ],
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("❌ Échec d'envoi :", response.status, responseText);
      return new Response(`Erreur : ${responseText}`, { status: 500 });
    }

    console.log("✅ Email envoyé avec succès à", email);
    return new Response("Email envoyé !");
  } catch (e) {
    console.error("❌ Erreur serveur :", e);
    return new Response("Erreur serveur", { status: 500 });
  }
}, { port: PORT });

console.log(`📨 Serveur SendGrid lancé sur http://localhost:${PORT}`);
