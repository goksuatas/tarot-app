import { createHash, createHmac, randomBytes } from "node:crypto";
import { deck, type Card } from "./cards";

// 2-3-2 açılımı: 7 pozisyon
export const POSITIONS = [
  { time: "Geçmiş", name: "Durumun kökü" },
  { time: "Geçmiş", name: "Geride kalan" },
  { time: "Şimdi", name: "Mevcut durum" },
  { time: "Şimdi", name: "Engel ya da iç çatışma" },
  { time: "Şimdi", name: "Gizli etken" },
  { time: "Gelecek", name: "Olası gidişat" },
  { time: "Gelecek", name: "Tavsiye" },
] as const;

export type DrawnCard = Card & {
  reversed: boolean;
  position: number;
  time: string;
  positionName: string;
};

// Sayıları kontrol eder. Sorun varsa mesaj döner, yoksa null.
export function validateNumbers(numbers: number[]): string | null {
  if (numbers.length !== 7) return "7 sayı seçmelisin.";
  if (!numbers.every((n) => Number.isInteger(n) && n >= 1 && n <= 78)) {
    return "Sayılar 1 ile 78 arasında olmalı.";
  }
  if (new Set(numbers).size !== 7) {
    return "Sayılar birbirinden farklı olmalı.";
  }
  return null;
}

// Tohumdan güvenli rastgele sayı üreten küçük bir motor
class SecureRng {
  private counter = 0;
  private buffer = Buffer.alloc(0);
  private offset = 0;

  constructor(private seed: Buffer) {}

  private nextUint32(): number {
    if (this.offset + 4 > this.buffer.length) {
      this.buffer = createHmac("sha256", this.seed)
        .update(String(this.counter++))
        .digest();
      this.offset = 0;
    }
    const value = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  // 0 ile max-1 arasında adil bir sayı verir (modulo yanlılığı yok)
  nextInt(max: number): number {
    const limit = Math.floor(0x100000000 / max) * max;
    let value: number;
    do {
      value = this.nextUint32();
    } while (value >= limit);
    return value % max;
  }
}

// Fisher-Yates karıştırma
function shuffle<T>(items: T[], rng: SecureRng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Ana fonksiyon: 7 sayıdan okumayı üretir
export function drawReading(
  numbers: number[],
  allowReversed = true
): DrawnCard[] {
  const error = validateNumbers(numbers);
  if (error) throw new Error(error);

  // Tohum = kullanıcının sayıları + rastgele tuz + zaman
  const salt = randomBytes(32);
  const seed = createHash("sha256")
    .update(numbers.join(","))
    .update(salt)
    .update(String(Date.now()))
    .digest();

  const rng = new SecureRng(seed);
  const shuffled = shuffle(deck, rng);

  return numbers.map((n, i) => ({
    ...shuffled[n - 1],
    reversed: allowReversed ? rng.nextInt(2) === 1 : false,
    position: i + 1,
    time: POSITIONS[i].time,
    positionName: POSITIONS[i].name,
  }));
}