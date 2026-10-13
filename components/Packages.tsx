"use client";
import { useState } from "react";

// İsimler yer tutucudur, kendi paketlerine göre değiştir
const PACKAGES = [
  { id: "pack3", title: "3 Okuma Paketi", text: "Üç farklı sorun için üç ayrı okuma. Aklındakileri tek tek sor." },
  { id: "monthly", title: "Aylık Paket", text: "Her ay daha fazla okuma ve geçmiş okumalarına dönebilme." },
  { id: "deep", title: "Derin Okuma", text: "Tek bir konuya daha uzun ve ayrıntılı bakış." },
];

export default function Packages() {
  const [chosen, setChosen] = useState<string[]>([]);

  async function interested(id: string) {
    if (chosen.includes(id)) return;
    setChosen((c) => [...c, id]);
    try {
      await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: id }),
      });
    } catch {
      // sessizce geç
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-3">
        {PACKAGES.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-amber-300/40 bg-purple-950/60 p-5 text-left shadow-[0_0_30px_rgba(167,100,255,0.25)] flex flex-col"
          >
            <h3 className="text-amber-100 font-semibold mb-2">{p.title}</h3>
            <p className="text-purple-200 text-sm leading-relaxed flex-1">{p.text}</p>
            <p className="text-purple-300/70 text-xs mt-3 mb-3">Yakında</p>
            <button
              onClick={() => interested(p.id)}
              disabled={chosen.includes(p.id)}
              className="rounded-lg border border-amber-300/60 py-2 text-sm text-amber-100 hover:bg-purple-800/50 transition disabled:opacity-60"
            >
              {chosen.includes(p.id) ? "Not aldık 🌙" : "İlgileniyorum"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-center text-purple-300/70 text-xs mt-4">
        Paketler hazırlanıyor. İlgini belirtmen, neye ihtiyaç duyulduğunu anlamamıza yardımcı olur.
      </p>
    </div>
  );
}