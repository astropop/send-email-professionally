import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ACCOUNTS } from "@/app/api/auth/route"

// ─── Schema ───────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  password:           z.string().min(1),
  type:               z.enum(["premium", "free"]),
  senderEmail:        z.string().email(),
  receiverEmail:      z.string().email(),
  transformedContent: z.string().min(1),
  targetlanguage:     z.string().min(1),
})

// ─── POST /api/email/send ─────────────────────────────────────────────────────
// Dùng cho: user "free" khi ấn "Gửi email", hoặc user "premium" sau khi xác nhận
// Request:  { password, type, senderEmail, receiverEmail, transformedContent, targetlanguage }
// Response: { status, senderEmail, receiverEmail, transformedContent, targetlanguage }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ.", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { password, type, senderEmail, receiverEmail, transformedContent, targetlanguage } = parsed.data

  // Kiểm tra mật khẩu khớp account
  const account = ACCOUNTS[password]
  if (!account || account.email !== senderEmail || account.type !== type) {
    return NextResponse.json({ error: "Xác thực không hợp lệ." }, { status: 401 })
  }

  // TODO: Tích hợp dịch vụ gửi email thực tế (SendGrid, Resend, Nodemailer…) tại đây.

  return NextResponse.json({
    status: "sent",
    senderEmail,
    receiverEmail,
    transformedContent,
    targetlanguage,
  })
}
