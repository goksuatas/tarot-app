import { status } from "../../../lib/limits";

export async function GET(req: Request) {
  return Response.json(await status(req));
}