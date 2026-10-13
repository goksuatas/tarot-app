import { createHmac, randomUUID } from "node:crypto";
import { incr, decr, getCount, usingRedis } from "./store";

const isProd = process.env.NODE_ENV === "production";

function config() {
  return {
    limit: Number(process.env.READING_LIMIT ?? 1),
    ipLimit: Number(process.env.IP_READING_LIMIT ?? 3),
    days: Number(process.env.LIMIT_DAYS ?? 30),
    // Sadece geliştirmede çalışır, yayında etkisizdir
    disabled: !isProd && process.env.LIMIT_DISABLED === "true",
  };
}

function identify(req: Request) {
  const raw = req.headers.get("cookie") ?? "";
  let vid: string | null = null;
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === "vid") vid = v.join("=");
  }

  let setCookie: string | undefined;
  if (!vid || !/^[a-f0-9-]{36}$/.test(vid)) {
    vid = randomUUID();
    setCookie = `vid=${vid}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${
      isProd ? "; Secure" : ""
    }`;
  }

  // IP'nin kendisi saklanmaz, sadece gizli anahtarla alınmış geri döndürülemez özeti
  const xff = req.headers.get("x-forwarded-for");
  const ip = xff?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const salt = process.env.LIMIT_SALT ?? "dev-only-salt";
  const ipHash = createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);

  return { vKey: `lim:v:${vid}`, ipKey: `lim:ip:${ipHash}`, setCookie };
}

export type Gate =
  | { ok: true; release: () => Promise<void>; setCookie?: string }
  | { ok: false; reason: "limit" | "unavailable"; message: string; setCookie?: string };

// Okumadan önce hak ayırır. Okuma başarısız olursa release() ile iade edilir.
export async function reserve(req: Request): Promise<Gate> {
  const cfg = config();
  const { vKey, ipKey, setCookie } = identify(req);

  if (cfg.disabled) return { ok: true, release: async () => {}, setCookie };

  if (isProd && (!usingRedis || !process.env.LIMIT_SALT)) {
    console.error("Limit sistemi yapılandırılmamış: Upstash anahtarları ve LIMIT_SALT gerekli.");
    return {
      ok: false,
      reason: "unavailable",
      message: "Şu an okuma yapılamıyor, biraz sonra tekrar dene.",
      setCookie,
    };
  }

  const ttl = cfg.days * 86400;
  const limited: Gate = {
    ok: false,
    reason: "limit",
    message: "Ücretsiz okuma hakkını kullandın.",
    setCookie,
  };

  try {
    const v = await incr(vKey, ttl);
    if (v > cfg.limit) {
      await decr(vKey);
      return limited;
    }
    const ip = await incr(ipKey, ttl);
    if (ip > cfg.ipLimit) {
      await decr(ipKey);
      await decr(vKey);
      return limited;
    }
    return {
      ok: true,
      setCookie,
      release: async () => {
        try {
          await decr(vKey);
          await decr(ipKey);
        } catch (e) {
          console.error(e);
        }
      },
    };
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      reason: "unavailable",
      message: "Şu an okuma yapılamıyor, biraz sonra tekrar dene.",
      setCookie,
    };
  }
}

// Sayfa açılırken: hak bitmiş mi? (hak harcamaz)
export async function status(req: Request): Promise<{ limited: boolean }> {
  const cfg = config();
  if (cfg.disabled) return { limited: false };
  try {
    const { vKey, ipKey } = identify(req);
    const [v, ip] = await Promise.all([getCount(vKey), getCount(ipKey)]);
    return { limited: v >= cfg.limit || ip >= cfg.ipLimit };
  } catch (e) {
    console.error(e);
    return { limited: false };
  }
}