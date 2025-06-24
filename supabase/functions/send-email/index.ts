/// <reference types="@supabase/functions" />
import { serve } from "std/http/server.ts";

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

    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const FROM_EMAIL = "socotaxi@gmail.com"; // adresse vérifiée

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: FROM_EMAIL },
        subject,
        content: [{ type: "text/plain", value: content }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(`Erreur SendGrid: ${error}`, {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response("Email envoyé avec succès", {
      status: 200,
      headers: corsHeaders,
    });

  } catch (e: unknown) {
    return new Response(`Erreur serveur: ${(e as Error).message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
