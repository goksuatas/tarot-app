import CardFace from "./CardFace";
import type { DrawnCard } from "../lib/shuffle";

export default function FlipCard({
  card,
  flipped,
}: {
  card: DrawnCard;
  flipped: boolean;
}) {
  return (
    <div className="scene" style={{ width: 160, height: 320 }}>
      <div
        className="flip-inner"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div className="flip-face">
          <div className="flip-back-card">
            <span className="card-symbol" style={{ fontSize: 48, color: "#fde68a" }}>
              ☾
            </span>
          </div>
        </div>
        <div className="flip-face flip-front">
          <CardFace card={card} reversed={card.reversed} />
        </div>
      </div>
    </div>
  );
}