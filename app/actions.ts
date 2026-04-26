"use server"

import { z } from "zod"

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserType = "premium" | "free"

export interface AccountConfig {
  email: string
  type: UserType
}

// ─── Config: thêm / sửa tài khoản tại đây ────────────────────────────────────
// Key là mật khẩu (phải bắt đầu bằng "admin" hoặc "user")
// Value chứa email và loại tài khoản

const ACCOUNTS: Record<string, AccountConfig> = {
  admin123: { email: "admin@abc.com", type: "premium" },
  user123:  { email: "user@abc.com",  type: "free"    },
  // Thêm tài khoản mới tại đây, ví dụ:
  // admin456: { email: "admin2@abc.com", type: "premium" },
  // user789:  { email: "user2@abc.com",  type: "free"    },
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const authSchema = z.object({
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu.")
    .regex(/^(admin|user)/, "Mật khẩu phải bắt đầu bằng 'admin' hoặc 'user'."),
})

const previewSchema = z.object({
  password:       z.string().min(1),
  type:           z.enum(["premium", "free"]),
  senderEmail:    z.string().email(),
  receiverEmail:  z.string().email(),
  rawContent:     z.string().min(1),
  targetlanguage: z.string().min(1),
})

const sendSchema = z.object({
  password:           z.string().min(1),
  type:               z.enum(["premium", "free"]),
  senderEmail:        z.string().email(),
  receiverEmail:      z.string().email(),
  transformedContent: z.string().min(1),
  targetlanguage:     z.string().min(1),
})

// ─── Response types ───────────────────────────────────────────────────────────

interface AuthSuccessResponse {
  success: true
  email: string
  type: UserType
}

interface AuthErrorResponse {
  success: false
  error: string
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse

interface PreviewSuccessResponse {
  success: true
  transformedContent: string
}

interface PreviewErrorResponse {
  success: false
  error: string
}

export type PreviewResponse = PreviewSuccessResponse | PreviewErrorResponse

interface SendSuccessResponse {
  success: true
  status: string
  senderEmail: string
  receiverEmail: string
  transformedContent: string
  targetlanguage: string
}

interface SendErrorResponse {
  success: false
  error: string
}

export type SendResponse = SendSuccessResponse | SendErrorResponse

// ─── Server Action: Xác thực mật khẩu ─────────────────────────────────────────
// Request:  { password: "user123" }
// Response: { success, email, type } | { success: false, error }

export async function authenticatePassword(password: string): Promise<AuthResponse> {
  const parsed = authSchema.safeParse({ password })

  if (!parsed.success) {
    const errorMsg = parsed.error.errors[0]?.message ?? "Mật khẩu không hợp lệ."
    return { success: false, error: errorMsg }
  }

  const account = ACCOUNTS[parsed.data.password]

  if (!account) {
    return { success: false, error: "Mật khẩu không đúng. Vui lòng thử lại." }
  }

  return { success: true, email: account.email, type: account.type }
}

// ─── Server Action: Xem trước email (Premium) ─────────────────────────────────
// Request:  { password, type, senderEmail, receiverEmail, rawContent, targetlanguage }
// Response: { success, transformedContent } | { success: false, error }

export async function previewEmail(data: {
  password: string
  type: UserType
  senderEmail: string
  receiverEmail: string
  rawContent: string
  targetlanguage: string
}): Promise<PreviewResponse> {
  const parsed = previewSchema.safeParse(data)

  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ." }
  }

  const { password, type, senderEmail, rawContent } = parsed.data

  // Xác thực mật khẩu khớp account
  const account = ACCOUNTS[password]
  if (!account || account.email !== senderEmail || account.type !== type) {
    return { success: false, error: "Xác thực không hợp lệ." }
  }

  // Chỉ premium mới được dùng action này
  if (account.type !== "premium") {
    return { success: false, error: "Chức năng chỉ dành cho tài khoản Premium." }
  }

  // TODO: Tích hợp dịch vụ dịch nội dung thực tế tại đây.
  // Hiện tại trả về mock data — thêm prefix [Translated] cho mỗi dòng.
  const transformedContent = rawContent
    .split("\n")
    .map((line) => `[Translated] ${line}`)
    .join("\n")

  return { success: true, transformedContent }
}

// ─── Server Action: Gửi email ─────────────────────────────────────────────────
// Dùng cho: user "free" khi ấn "Gửi email", hoặc user "premium" sau khi xác nhận
// Request:  { password, type, senderEmail, receiverEmail, transformedContent, targetlanguage }
// Response: { success, status, senderEmail, receiverEmail, transformedContent, targetlanguage }

export async function sendEmail(data: {
  password: string
  type: UserType
  senderEmail: string
  receiverEmail: string
  transformedContent: string
  targetlanguage: string
}): Promise<SendResponse> {
  const parsed = sendSchema.safeParse(data)

  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ." }
  }

  const { password, type, senderEmail, receiverEmail, transformedContent, targetlanguage } = parsed.data

  // Xác thực mật khẩu khớp account
  const account = ACCOUNTS[password]
  if (!account || account.email !== senderEmail || account.type !== type) {
    return { success: false, error: "Xác thực không hợp lệ." }
  }

  // TODO: Tích hợp dịch vụ gửi email thực tế (SendGrid, Resend, Nodemailer…) tại đây.

  return {
    success: true,
    status: "sent",
    senderEmail,
    receiverEmail,
    transformedContent,
    targetlanguage,
  }
}
