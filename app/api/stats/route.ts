import { getCount } from "../../../lib/store";

const KEYS = [
  "feedback:touched",
  "feedback:some",
  "feedback:no",
  "interest:pack3",
  "interest:monthly",
  "interest:deep",
];

export async function GET(req: Request) {
  const adminKey = process.env.ADMIN_KEY;
  const given = new URL(req.url).searchParams.get("key");
  if (!adminKey || given !== adminKey) {
    return new Response("Not found", { status: 404 });
  }
  const entries = await Promise.all(
    KEYS.map(async (k) => [k, await getCount(k)] as const)
  );
  return Response.json(Object.fromEntries(entries));
}