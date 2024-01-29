import labors from "../lib/labors.json";

export async function GET() {
  return Response.json({ labors });
}
