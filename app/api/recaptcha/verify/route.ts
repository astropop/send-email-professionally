import { NextRequest, NextResponse } from "next/server";

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: string = body?.token ?? "";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "missing-input-response" },
        { status: 400 },
      );
    }

    const secret = process.env.NEXT_PUBLIC_RECAPTCHA_SECRECT_KEY;
    if (!secret) {
      console.error("Missing NEXT_PUBLIC_RECAPTCHA_SECRECT_KEY");
      return NextResponse.json(
        { success: false, error: "server-configuration-error" },
        { status: 500 },
      );
    }

    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "recaptcha-service-unavailable" },
        { status: 502 },
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: data.success === true,
      errorCodes: data["error-codes"] ?? [],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "internal-server-error" },
      { status: 500 },
    );
  }
}
