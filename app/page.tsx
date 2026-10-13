"use client";
import { useEffect, useState } from "react";
import CardFace from "../components/CardFace";
import FlipCard from "../components/FlipCard";
import Packages from "../components/Packages";
import Feedback from "../components/Feedback";
import type { DrawnCard } from "../lib/shuffle";

type Result = {
  answer: string;
  cards: { position: number; comment: string }[];
  periods: { past: string; present: string; future: string };
  advice: string;
};

const PERIODS = [
  { key: "past", title: "Geçmiş", time: "Geçmiş" },
  { key: "present", title: "Şimdi", time: "Şimdi" },
  { key: "future", title: "Gelecek", time: "Gelecek" },
] as const;

const ROWS = [
  { title: "Geçmiş", from: 0, to: 2 },
  { title: "Şimdi", from: 2, to: 5 },
  { title: "Gelecek", from: 5, to: 7 },
];

export default function Home() {
  const [stage, setStage] = useState<
    "ask" | "numbers" | "reveal" | "result" | "error" | "limit"
  >("ask");
  const [question, setQuestion] = useState("");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [input, setInput] = useState("");
  const [warning, setWarning] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [limitedNow, setLimitedNow] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Sayfa açılırken: hakkı bitmişse doğrudan paket ekranı
  useEffect(() => {
    fetch("/api/limit")
      .then((r) => r.json())
      .then((d) => {
        setLimitedNow(!!d.limited);
        if (d.limited) setStage((s) => (s === "ask" ? "limit" : s));
      })
      .catch(() => {});
  }, []);

  // Okuma bitince hak doldu mu diye tekrar bak
  useEffect(() => {
    if (stage !== "result") return;
    fetch("/api/limit")
      .then((r) => r.json())
      .then((d) => setLimitedNow(!!d.limited))
      .catch(() => {});
  }, [stage]);

  // Kartlar gelince tek tek çevir
  useEffect(() => {
    if (stage !== "reveal" || cards.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 7; i++) {
      timers.push(setTimeout(() => setRevealed(i + 1), 900 + i * 1200));
    }
    return () => timers.forEach(clearTimeout);
  }, [stage, cards.length]);

  // Hem kartlar açıldıysa hem yorum geldiyse okuma sayfasına geç
  useEffect(() => {
    if (stage === "reveal" && result && revealed >= 7) {
      const t = setTimeout(() => {
        setStage("result");
        window.scrollTo(0, 0);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [stage, result, revealed]);

  function handleMove(e: React.MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: -((e.clientY - r.top) / r.height - 0.5) * 25,
      y: ((e.clientX - r.left) / r.width - 0.5) * 25,
    });
  }

  function startNumbers() {
    if (question.trim().length < 10) {
      setWarning("Sorunu biraz daha anlatır mısın? En az bir iki cümle yaz.");
      return;
    }
    setWarning("");
    setStage("numbers");
  }

  function addNumber() {
    const n = Number(input);
    if (!Number.isInteger(n) || n < 1 || n > 78) {
      setWarning("1 ile 78 arasında bir sayı yaz.");
      return;
    }
    if (numbers.includes(n)) {
      setWarning("Bu sayıyı zaten seçtin, aklına gelen başka bir sayıyı yaz.");
      return;
    }
    setWarning("");
    setInput("");
    const next = [...numbers, n];
    setNumbers(next);
    if (next.length === 7) submit(next);
  }

  async function submit(nums: number[]) {
    setCards([]);
    setResult(null);
    setRevealed(0);
    setErrorMsg("");
    setStage("reveal");
    window.scrollTo(0, 0);

    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, numbers: nums }),
      });

      if (res.status === 429) {
        setLimitedNow(true);
        setStage("limit");
        return;
      }

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Bir şeyler ters gitti.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotResult = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line);
          if (msg.type === "cards") setCards(msg.cards);
          else if (msg.type === "result") {
            setResult(msg.result);
            gotResult = true;
          } else if (msg.type === "error") throw new Error(msg.error);
        }
      }
      if (!gotResult) throw new Error("Bağlantı yarıda kesildi.");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Bir şeyler ters gitti.");
      setStage("error"); // sayılar korunur
    }
  }

  function restart() {
    setQuestion("");
    setNumbers([]);
    setInput("");
    setWarning("");
    setErrorMsg("");
    setCards([]);
    setResult(null);
    setRevealed(0);
    setStage(limitedNow ? "limit" : "ask");
    window.scrollTo(0, 0);
  }

  const moonCard = (
    <div className="scene relative z-10">
      <div className="floaty">
        <div
          className="tarot-card flex items-center justify-center"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          <span className="card-symbol text-6xl text-amber-200">☾</span>
        </div>
      </div>
    </div>
  );

  const circles = (
    <div className="flex justify-center gap-2 mb-5">
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border ${
            numbers[i]
              ? "border-amber-300 bg-purple-700/70 text-amber-100 shadow-[0_0_14px_rgba(233,196,106,0.6)]"
              : "border-purple-400/40 text-purple-300/40"
          }`}
        >
          {numbers[i] ?? "·"}
        </div>
      ))}
    </div>
  );

  const button =
    "w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 font-medium shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:shadow-[0_0_40px_rgba(217,70,239,0.8)] transition";

  return (
    <main
      onMouseMove={handleMove}
      className="mystic-bg relative min-h-screen text-white overflow-hidden"
    >
      <div className="stars" />

      {stage === "ask" && (
        <section className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-8 p-6">
          {moonCard}
          <div className="w-full max-w-md text-center">
            <h1 className="text-3xl font-semibold text-amber-100 mb-2">Kartlar seni dinliyor</h1>
            <p className="text-purple-200 mb-5">
              Ne yaşıyorsun, neyi merak ediyorsun? Ne kadar çok anlatırsan kartlar o kadar net konuşur.
            </p>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={5}
              placeholder="Örneğin: Sevgilimle iki ay önce ayrıldık, ben hâlâ onu düşünüyorum. Bana geri dönecek mi?"
              className="w-full rounded-xl bg-purple-950/60 border border-purple-400/40 p-4 text-white placeholder-purple-300/60 outline-none focus:border-amber-300"
            />
            {warning && <p className="mt-3 text-amber-300 text-sm">{warning}</p>}
            <button onClick={startNumbers} className={`mt-4 ${button}`}>
              Kartlarını çağır
            </button>
          </div>
        </section>
      )}

      {stage === "numbers" && (
        <section className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-8 p-6">
          {moonCard}
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-semibold text-amber-100 mb-2">
              {numbers.length + 1}. sayı
            </h2>
            <p className="text-purple-200 mb-5">
              Gözlerini kapat, derin bir nefes al. Aklına gelen ilk sayıyı yaz (1-78).
            </p>
            {circles}
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNumber()}
              min={1}
              max={78}
              autoFocus
              className="w-full rounded-xl bg-purple-950/60 border border-purple-400/40 p-4 text-center text-2xl text-white outline-none focus:border-amber-300"
            />
            {warning && <p className="mt-3 text-amber-300 text-sm">{warning}</p>}
            <button onClick={addNumber} className={`mt-4 ${button}`}>
              Onayla
            </button>
          </div>
        </section>
      )}

      {stage === "reveal" && (
        <section className="relative z-10 min-h-screen flex flex-col items-center gap-8 px-4 py-10">
          {cards.length === 0 ? (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-8">
              {moonCard}
              <p className="text-xl text-amber-100 soft-pulse">Kartların çağrılıyor…</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl text-amber-100">Kartların açılıyor</h2>
              {ROWS.map((row) => (
                <div key={row.title} className="flex flex-col items-center gap-3">
                  <p className="text-amber-200 tracking-widest uppercase text-sm">{row.title}</p>
                  <div className="flex flex-wrap justify-center gap-6">
                    {cards.slice(row.from, row.to).map((c, i) => (
                      <FlipCard key={c.position} card={c} flipped={revealed > row.from + i} />
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-purple-200 text-sm text-center soft-pulse">
                {revealed < 7
                  ? "Kartlar tek tek açılıyor…"
                  : result
                  ? "Hazır…"
                  : "Kartlara bakıyorum, bir dakika…"}
              </p>
            </>
          )}
        </section>
      )}

      {stage === "error" && (
        <section className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-8 p-6">
          {moonCard}
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-semibold text-amber-100 mb-2">Kartlar bir an sustu</h2>
            <p className="text-purple-200 mb-5">{errorMsg}</p>
            {circles}
            <p className="text-purple-300/80 text-sm mb-5">
              Sayıların ve sorun duruyor, baştan yazmana gerek yok.
            </p>
            <button onClick={() => submit(numbers)} className={button}>
              Tekrar dene
            </button>
            <button
              onClick={restart}
              className="mt-4 text-sm text-purple-300 underline underline-offset-4"
            >
              Baştan başla
            </button>
          </div>
        </section>
      )}

      {stage === "limit" && (
        <section className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-8 p-6 text-center">
          {moonCard}
          <div className="w-full max-w-3xl">
            <h2 className="text-2xl font-semibold text-amber-100 mb-2">
              Ücretsiz okuma hakkını kullandın
            </h2>
            <p className="text-purple-200 mb-8">
              Hakkın zamanla yenilenir. Beklemek istemezsen aşağıdaki paketlere göz atabilirsin.
            </p>
            <Packages />
          </div>
        </section>
      )}

      {stage === "result" && result && (
        <section className="relative z-10 max-w-4xl mx-auto p-6 pb-20">
          <h1 className="text-3xl font-semibold text-amber-100 text-center my-8">Okuman</h1>

          <div className="max-w-2xl mx-auto mb-14 rounded-2xl border border-amber-300/50 bg-purple-950/60 p-6 text-center shadow-[0_0_40px_rgba(233,196,106,0.25)]">
            <p className="text-amber-200 tracking-widest uppercase text-xs mb-3">
              Kartların cevabı
            </p>
            <p className="text-lg text-amber-50 leading-relaxed">{result.answer}</p>
          </div>

          {PERIODS.map((p) => (
            <div key={p.key} className="mb-14">
              <h2 className="text-2xl text-amber-200 text-center mb-6">{p.title}</h2>
              <div className="flex flex-wrap justify-center gap-8 mb-6">
                {cards
                  .filter((c) => c.time === p.time)
                  .map((c) => (
                    <div key={c.position} className="w-52 flex flex-col items-center gap-3">
                      <CardFace card={c} reversed={c.reversed} />
                      <p className="text-sm text-purple-100 leading-relaxed">
                        {result.cards.find((x) => x.position === c.position)?.comment}
                      </p>
                    </div>
                  ))}
              </div>
              <p className="text-purple-100 leading-relaxed max-w-2xl mx-auto bg-purple-950/50 border border-purple-400/20 rounded-xl p-5">
                {result.periods[p.key]}
              </p>
            </div>
          ))}

          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl text-amber-200 mb-3">Sana bir not</h2>
            <p className="text-purple-100 leading-relaxed mb-12">{result.advice}</p>

            <Feedback />

            {limitedNow && (
              <div className="mb-12">
                <h2 className="text-2xl text-amber-200 mb-2">Daha fazlasını ister misin?</h2>
                <p className="text-purple-200 text-sm mb-6">
                  Aklında başka sorular varsa onlara da bakabiliriz.
                </p>
                <Packages />
              </div>
            )}

            <button onClick={restart} className={button}>
              Yeni bir okuma yap
            </button>
            <p className="mt-10 text-xs text-purple-300/70">
              Tarot bir eğlence ve öz-düşünme aracıdır, kesin bir yol haritası değildir.
              <br />
              Çizimler: Pamela Colman Smith, 1909.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}