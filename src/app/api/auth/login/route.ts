import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { email, password } = body;
  const expectedEmail = process.env.AUTH_EMAIL;
  const expectedPassword = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!expectedEmail || !expectedPassword || !secret) {
    return NextResponse.json(
      { error: "Variáveis de autenticação não configuradas" },
      { status: 500 },
    );
  }

  if (email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("n8n-snipper-session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
