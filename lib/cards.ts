export type Card = {
  id: number;
  name: string;
  arcana: "major" | "minor";
  suit?: "Asalar" | "Kupalar" | "Kılıçlar" | "Tılsımlar";
};

const majors = [
  "Deli", "Büyücü", "Azize", "İmparatoriçe", "İmparator", "Aziz",
  "Aşıklar", "Savaş Arabası", "Güç", "Ermiş", "Kader Çarkı", "Adalet",
  "Asılan Adam", "Ölüm", "Denge", "Şeytan", "Kule", "Yıldız",
  "Ay", "Güneş", "Mahkeme", "Dünya",
];

const suits = ["Asalar", "Kupalar", "Kılıçlar", "Tılsımlar"] as const;

const ranks = [
  "As", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi",
  "Sekiz", "Dokuz", "On", "Prens", "Şövalye", "Kraliçe", "Kral",
];

export const deck: Card[] = [
  ...majors.map((name, i): Card => ({ id: i, name, arcana: "major" })),
  ...suits.flatMap((suit, s) =>
    ranks.map(
      (rank, r): Card => ({
        id: 22 + s * 14 + r,
        name: `${suit} ${rank}`,
        arcana: "minor",
        suit,
      })
    )
  ),
];