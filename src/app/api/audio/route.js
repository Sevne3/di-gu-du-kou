// Proxy for NetEase Cloud Music audio
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req) {
  const url = new URL(req.url);
  const songId = url.searchParams.get("id") || "1950777012";

  try {
    const neteaseUrl = "https://music.163.com/song/media/outer/url?id=" + songId + ".mp3";
    
    const response = await fetch(neteaseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://music.163.com",
        "Accept": "*/*"
      },
      redirect: "follow"
    });

    if (!response.ok && response.status !== 206) {
      // Fallback to a direct audio source
      const fallbackUrl = "https://music.163.com/song/media/outer/url?id=" + songId + ".mp3";
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com" },
        redirect: "follow"
      });
      return new Response(fallbackRes.body, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Accept-Ranges": "bytes",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (e) {
    console.error("Audio proxy error:", e.message);
    return new Response("Audio unavailable", { status: 503,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}
