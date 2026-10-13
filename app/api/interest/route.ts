import { incr } from "../../../lib/store";

const ALLOWED = ["pack3", "monthly", "deep"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (ALLOWED.includes(body.package)) await incr(`interest:${body.package}`);
  } catch {
    // sessizce geç
  }
  return Response.json({ ok: true });
}