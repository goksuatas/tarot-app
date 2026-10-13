import type { Card } from "../lib/cards";

// Her takımın kendi ışıma rengi (R, G, B)
const GLOWS: Record<string, string> = {
  major: "233, 196, 106",
  Asalar: "251, 146, 60",
  Kupalar: "34, 211, 238",
  Kılıçlar: "165, 180, 252",
  Tılsımlar: "52, 211, 153",
};

export default function CardFace({
  card,
  reversed = false,
}: {
  card: Card;
  reversed?: boolean;
}) {
  const key = card.arcana === "major" ? "major" : card.suit!;
  const rgb = GLOWS[key];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div className="scene">
        <div
          className="face-card"
          style={{
            ["--glow" as string]: rgb,
            width: 160,
            height: 280,
            borderRadius: 12,
            overflow: "hidden",
            border: `2px solid rgba(${rgb}, 0.9)`,
            boxShadow: `0 0 20px rgba(${rgb}, 0.6), 0 0 60px rgba(${rgb}, 0.35)`,
          }}
        >
          <img
            src={`/cards/${card.id}.jpg`}
            alt={card.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transform: reversed ? "rotate(180deg)" : undefined,
            }}
          />
        </div>
      </div>
      <p style={{ color: "#fef3c7", fontSize: 14, textAlign: "center" }}>
        {card.name}
        {reversed ? " (ters)" : ""}
      </p>
    </div>
  );
}