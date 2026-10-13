import { drawReading, validateNumbers } from "../../../lib/shuffle";
import { interpret } from "../../../lib/interpret";
import { reserve } from "../../../lib/limits";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { question?: unknown; numbers?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const numbers = Array.isArray(body.numbers) ? body.numbers.map(Number) : [];

  if (question.length < 10) {
    return Response.json(
      { error: "Sorunu biraz daha anlatır mısın? En az bir iki cümle yaz." },
      { status: 400 }
    );
  }
  if (question.length > 1500) {
    return Response.json({ error: "Soru biraz uzun, kısaltır mısın?" }, { status: 400 });
  }

  const problem = validateNumbers(numbers);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  // Geçersiz istekler hak harcamaz; geçerli olanlar için hak ayırıyoruz
  const gate = await reserve(req);
  const cookieHeaders: Record<string, string> = gate.setCookie
    ? { "Set-Cookie": gate.setCookie }
    : {};

  if (!gate.ok) {
    return Response.json(
      { error: gate.message, limited: gate.reason === "limit" },
      { status: gate.reason === "limit" ? 429 : 503, headers: cookieHeaders }
    );
  }

  const cards = drawReading(numbers);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "cards", cards });

      try {
        const result = await interpret(question, cards);
        send({ type: "result", result });
      } catch (e) {
        console.error(e);
        await gate.release(); // yorum üretilemediyse hak iade edilir
        send({ type: "error", error: "Yorum şu an hazırlanamadı. Biraz sonra tekrar dene." });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      ...cookieHeaders,
    },
  });
}