"use client";
import { useState } from "react";

const OPTIONS = [
  { id: "touched", label: "Çok dokundu", emoji: "💜" },
  { id: "some", label: "Biraz", emoji: "🌙" },
  { id: "no", label: "Dokunmadı", emoji: "🌫️" },
];

export default function Feedback() {
  const [sent, setSent] = useState(false);

  async function send(id: string) {
    setSent(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: id }),
      });
    } catch {
      // sessizce geç
    }
  }

  if (sent) {
    return <p className="text-amber-200 mb-12">Teşekkürler, bunu duymak çok değerli. 🌙</p>;
  }

  return (
    <div className="mb-12">
      <p className="text-purple-100 mb-4">Bu okuma sana dokundu mu?</p>
      <div className="flex justify-center gap-3 flex-wrap">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => send(o.id)}
            className="rounded-xl border border-amber-300/50 bg-purple-950/60 px-4 py-2 text-sm text-amber-100 hover:bg-purple-800/50 transition"
          >
            {o.emoji} {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}