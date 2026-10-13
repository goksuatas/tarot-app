import Anthropic from "@anthropic-ai/sdk";
import type { DrawnCard } from "./shuffle";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

const client = new Anthropic(); // anahtarı .env.local'dan kendisi okur

async function ask(question: string, cards: DrawnCard[]) {
  const message = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(question, cards) }],
  });

  if (message.stop_reason === "max_tokens") {
    throw new Error("Cevap uzunluk sınırına takıldı.");
  }

  const text = message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Cevap beklenen biçimde gelmedi: " + text.slice(0, 200));
  }
  return JSON.parse(text.slice(start, end + 1));
}

// Bir kez başarısız olursa otomatik olarak bir daha dener
export async function interpret(question: string, cards: DrawnCard[]) {
  try {
    return await ask(question, cards);
  } catch (e) {
    console.error("İlk deneme başarısız, tekrar deneniyor:", e);
    return await ask(question, cards);
  }
}