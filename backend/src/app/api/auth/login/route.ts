import { loginController } from "@/controllers/authController";

export async function POST(req: Request) {
  return loginController(req);
}