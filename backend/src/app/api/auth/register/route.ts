import { registerController } from "@/controllers/authController";

export async function POST(req: Request) {
  return registerController(req);
}
