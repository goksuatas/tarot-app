import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

export const usingRedis = redis !== null;

// Redis yoksa (sadece geliştirme için) bellekte tutulur, sunucu kapanınca sıfırlanır
const g = globalThis as unknown as {
  __tarotMem?: Map<string, { n: number; exp: number }>;
};
const mem = (g.__tarotMem ??= new Map<string, { n: number; exp: number }>());

function memGet(key: string) {
  const e = mem.get(key);
  if (!e) return null;
  if (e.exp && e.exp < Date.now()) {
    mem.delete(key);
    return null;
  }
  return e;
}

export async function incr(key: string, ttlSeconds?: number): Promise<number> {
  if (redis) {
    const n = await redis.incr(key);
    if (n === 1 && ttlSeconds) await redis.expire(key, ttlSeconds);
    return n;
  }
  const e = memGet(key);
  if (!e) {
    mem.set(key, { n: 1, exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
    return 1;
  }
  e.n += 1;
  return e.n;
}

export async function decr(key: string): Promise<void> {
  if (redis) {
    const n = await redis.decr(key);
    if (n < 0) await redis.set(key, 0);
    return;
  }
  const e = memGet(key);
  if (e && e.n > 0) e.n -= 1;
}

export async function getCount(key: string): Promise<number> {
  if (redis) {
    const v = await redis.get<number>(key);
    return Number(v ?? 0);
  }
  return memGet(key)?.n ?? 0;
}