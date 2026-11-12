export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "https://andux-cps.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST" || new URL(request.url).pathname !== "/api/chat") {
      return Response.json({ status: "DARK AI online" }, { headers: cors });
    }

    if (!env.GEMINI_API_KEY) {
      return Response.json({ error: "API key belum diatur." }, {
        status: 500, headers: cors
      });
    }

    try {
      const { message } = await request.json();

      if (typeof message !== "string" || !message.trim()) {
        return Response.json({ error: "Pesan kosong." }, {
          status: 400, headers: cors
        });
      }

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: message.slice(0, 4000) }]
            }]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return Response.json({ error: "Gemini API gagal merespons." }, {
          status: 502, headers: cors
        });
      }

      const reply = data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "").join("");

      return Response.json({
        reply: reply || "AI belum memberikan jawaban."
      }, { headers: cors });

    } catch {
      return Response.json({ error: "Terjadi kesalahan server." }, {
        status: 500, headers: cors
      });
    }
  }
};