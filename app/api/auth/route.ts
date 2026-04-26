import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// ─── Config: thêm / sửa tài khoản tại đây ────────────────────────────────────
// Đây là nguồn dữ liệu duy nhất cho toàn bộ API

export type UserType = "premium" | "free"

export interface AccountConfig {
  email: string
  type: UserType
}

export const ACCOUNTS: Record<string, AccountConfig> = {
  admin123: { email: "admin@abc.com", type: "premium" },
  user123:  { email: "user@abc.com",  type: "free"    },
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  password: z.string().min(1),
})

// ─── POST /api/auth ───────────────────────────────────────────────────────────
// Request:  { "password": "user123" }
// Response: { "email": "abc@gmail.com", "type": "free" }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Vui lòng nhập mật khẩu." }, { status: 400 })
  }

  const account = ACCOUNTS[parsed.data.password]

  if (!account) {
    return NextResponse.json({ error: "Mật khẩu không đúng. Vui lòng thử lại." }, { status: 401 })
  }

  return NextResponse.json({ email: account.email, type: account.type })
}
