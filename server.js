const http = require("node:http");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const ALLOWED_ORIGIN = "https://andux-cps.github.io";

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  if (req.url === "/health" && req.method === "GET") {
    res.end(JSON.stringify({ status: "online" }));
    return;
  }

  if (req.url !== "/api/chat" || req.method !== "POST") {
    res.writeHead(404).end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (!API_KEY) {
    res.writeHead(500).end(JSON.stringify({
      error: "API key belum diatur di server."
    }));
    return;
  }

  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 12000) {
        res.writeHead(413).end(JSON.stringify({
          error: "Pesan terlalu panjang."
        }));
        return;
      }
    }

    const { message } = JSON.parse(body);

    if (typeof message !== "string" || !message.trim()) {
      res.writeHead(400).end(JSON.stringify({
        error: "Pesan tidak boleh kosong."
      }));
      return;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY
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
      console.error("Gemini API error:", response.status);
      res.writeHead(502).end(JSON.stringify({
        error: "AI sedang bermasalah. Coba lagi nanti."
      }));
      return;
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("");

    res.end(JSON.stringify({
      reply: answer || "AI belum memberikan jawaban."
    }));

  } catch (error) {
    console.error(error);
    res.writeHead(500).end(JSON.stringify({
      error: "Terjadi kesalahan pada server."
    }));
  }
});

server.listen(PORT, () => {
  console.log(`DARK AI berjalan di port ${PORT}`);
});