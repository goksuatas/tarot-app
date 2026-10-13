import { incr } from "../../../lib/store";

const ALLOWED = ["touched", "some", "no"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (ALLOWED.includes(body.answer)) await incr(`feedback:${body.answer}`);
  } catch {
    // sessizce geç
  }
  return Response.json({ ok: true });
}