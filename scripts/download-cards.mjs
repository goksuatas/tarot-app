import { mkdir, writeFile } from "node:fs/promises";

const majors = [
  "00_Fool", "01_Magician", "02_High_Priestess", "03_Empress", "04_Emperor",
  "05_Hierophant", "06_Lovers", "07_Chariot", "08_Strength", "09_Hermit",
  "10_Wheel_of_Fortune", "11_Justice", "12_Hanged_Man", "13_Death",
  "14_Temperance", "15_Devil", "16_Tower", "17_Star", "18_Moon", "19_Sun",
  "20_Judgement", "21_World",
];

// id sırası cards.ts ile aynı: majör, Asalar, Kupalar, Kılıçlar, Tılsımlar
const files = [
  ...majors.map((m) => `RWS_Tarot_${m}.jpg`),
  ...["Wands", "Cups", "Swords", "Pents"].flatMap((suit) =>
    Array.from({ length: 14 }, (_, i) => `${suit}${String(i + 1).padStart(2, "0")}.jpg`)
  ),
];

await mkdir("public/cards", { recursive: true });

const failed = [];

for (let id = 0; id < files.length; id++) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${files[id]}?width=600`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TarotApp/0.1 (kisisel proje; iletisim: atasgoksu1@gmail.com)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(`public/cards/${id}.jpg`, Buffer.from(await res.arrayBuffer()));
    console.log(`✓ ${id}  ${files[id]}`);
  } catch (e) {
    console.log(`✗ ${id}  ${files[id]}  (${e.message})`);
    failed.push(`${id} ${files[id]}`);
  }
  await new Promise((r) => setTimeout(r, 400)); // sunucuyu yormamak için bekle
}

console.log(failed.length ? `\nİnmeyenler:\n${failed.join("\n")}` : "\nHepsi indi 🎉");