import { googleLoginController } from "@/controllers/authController";

export async function POST(req: Request) {
  return googleLoginController(req);
}
