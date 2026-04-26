import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ACCOUNTS } from "@/app/api/auth/route"

// ─── Schema ───────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  password:        z.string().min(1),
  type:            z.enum(["premium", "free"]),
  senderEmail:     z.string().email(),
  receiverEmail:   z.string().email(),
  rawContent:      z.string().min(1),
  targetlanguage:  z.string().min(1),
})

// ─── POST /api/email/preview ──────────────────────────────────────────────────
// Chỉ dành cho user loại "premium"
// Request:  { password, type, senderEmail, receiverEmail, rawContent, targetlanguage }
// Response: { "transformedContent": "..." }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ.", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { password, type, senderEmail, rawContent } = parsed.data

  // Kiểm tra mật khẩu khớp account
  const account = ACCOUNTS[password]
  if (!account || account.email !== senderEmail || account.type !== type) {
    return NextResponse.json({ error: "Xác thực không hợp lệ." }, { status: 401 })
  }

  // Chỉ premium mới được dùng endpoint này
  if (account.type !== "premium") {
    return NextResponse.json({ error: "Endpoint chỉ dành cho tài khoản Premium." }, { status: 403 })
  }

  // TODO: Tích hợp dịch vụ dịch nội dung thực tế tại đây.
  // Hiện tại trả về mock data — giữ nguyên nội dung như ví dụ.
  const transformedContent = rawContent
    .split("\n")
    .map((line) => `[Translated] ${line}`)
    .join("\n")

  return NextResponse.json({ transformedContent })
}
