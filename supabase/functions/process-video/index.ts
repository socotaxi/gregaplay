// Edge Function Supabase avec CORS + Traitement vidéo
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { create } from "https://deno.land/std@0.224.0/fs/mod.ts"
import { join } from "https://deno.land/std@0.224.0/path/mod.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "*"

  // Prévol (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  // Vérifier la méthode
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json',
      }
    })
  }

  // Lire l’eventId dans l’URL
  const url = new URL(req.url)
  const eventId = url.searchParams.get("eventId")
  if (!eventId) {
    return new Response(JSON.stringify({ error: "eventId requis" }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': origin }
    })
  }

  try {
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("storage_path")
      .eq("event_id", eventId)
      .order("created_at")

    if (videosError) throw videosError
    if (!videos || videos.length === 0) {
      throw new Error("Aucune vidéo trouvée pour cet événement")
    }

    // Créer dossier temporaire
    const tmpDir = await Deno.makeTempDir()
    const listFile = join(tmpDir, "list.txt")
    const fileList: string[] = []

    for (const v of videos) {
      const { data: fileData, error: fileErr } = await supabase.storage
        .from("videos")
        .download(v.storage_path)

      if (fileErr || !fileData) {
        return new Response(JSON.stringify({
          error: "Erreur téléchargement vidéo",
          path: v.storage_path,
          details: fileErr?.message
        }), {
          status: 500,
          headers: { 'Access-Control-Allow-Origin': origin }
        })
      }

      const filePath = join(tmpDir, v.storage_path.split("/").pop()!)
      const buffer = await fileData.arrayBuffer()
      await Deno.writeFile(filePath, new Uint8Array(buffer))
      fileList.push(`file '${filePath.replace(/'/g, "'\\''")}'`)
    }

    await Deno.writeTextFile(listFile, fileList.join("\n"))

    const outputPath = join(tmpDir, "final.mp4")

    // FFmpeg (⚠️ Doit être activé dans Supabase Function Runtime, voir doc)
    const ffmpeg = new Deno.Command("ffmpeg", {
      args: [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        outputPath
      ],
      stderr: "piped"
    })

    const { code, stderr } = await ffmpeg.output()
    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr)
      throw new Error(`FFmpeg a échoué : ${errorText}`)
    }

    const buffer = await Deno.readFile(outputPath)
    const storagePath = `final_videos/${eventId}.mp4`

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: "video/mp4"
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from("videos")
      .getPublicUrl(storagePath)

    const finalUrl = urlData.publicUrl

    const { error: updateError } = await supabase
      .from("events")
      .update({ final_video_url: finalUrl, status: "done" })
      .eq("id", eventId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ message: "✅ Vidéo traitée", final_video_url: finalUrl }), {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erreur serveur", details: error.message }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json'
      }
    })
  }
})
