"use server";

import { z } from "zod";

// ─── API Configuration ────────────────────────────────────────────────────────
// Thay đổi domain tại đây để gửi request đến server khác
// Để trống hoặc "/" nếu gửi request đến cùng server (internal)

const API_BASE_URL = process.env.API_BASE_URL ?? "";

// Các endpoint — chỉ cần sửa tại đây để thay đổi đường dẫn
const ENDPOINTS = {
  auth: "/api/auth",
  preview: "/api/email/preview",
  send: "/api/email/send",
} as const;

// Helper để tạo full URL
function getEndpointUrl(endpoint: keyof typeof ENDPOINTS): string {
  return `${API_BASE_URL}${ENDPOINTS[endpoint]}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserType = "premium" | "free";

export interface AccountConfig {
  name: string;
  email: string;
  type: UserType;
}

// ─── Config: thêm / sửa tài khoản tại đây ────────────────────────────────────
// Key là mật khẩu (phải bắt đầu bằng "admin" hoặc "user")
// Value chứa name, email và loại tài khoản

const ACCOUNTS: Record<string, AccountConfig> = {
  admin123: { name: "Admin", email: "admin@abc.com", type: "premium" },
  user123: { name: "User", email: "user@abc.com", type: "free" },
  // Thêm tài khoản mới tại đây, ví dụ:
  // admin456: { name: "Admin 2", email: "admin2@abc.com", type: "premium" },
  // user789:  { name: "User 2",  email: "user2@abc.com",  type: "free"    },
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const authSchema = z.object({
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu.")
    .regex(/^(admin|user)/, "Mật khẩu phải bắt đầu bằng 'admin' hoặc 'user'."),
});

const previewSchema = z.object({
  password: z.string().min(1),
  type: z.enum(["premium", "free"]),
  senderEmail: z.string().email(),
  receiverEmail: z.string().email(),
  subject: z.string().min(1),
  rawContent: z.string().min(1),
  targetlanguage: z.string().min(1),
});

const sendSchema = z.object({
  password: z.string().min(1),
  type: z.enum(["premium", "free"]),
  senderEmail: z.string().email(),
  receiverEmail: z.string().email(),
  subject: z.string().min(1),
  transformedContent: z.string().min(1),
  targetlanguage: z.string().min(1),
});

// ─── Response types ───────────────────────────────────────────────────────────

interface AuthSuccessResponse {
  success: true;
  name: string;
  email: string;
  type: UserType;
}

interface AuthErrorResponse {
  success: false;
  error: string;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

interface PreviewSuccessResponse {
  success: true;
  transformedContent: string;
}

interface PreviewErrorResponse {
  success: false;
  error: string;
}

export type PreviewResponse = PreviewSuccessResponse | PreviewErrorResponse;

interface SendSuccessResponse {
  success: true;
  status: string;
  senderEmail: string;
  receiverEmail: string;
  subject: string;
  transformedContent: string;
  targetlanguage: string;
}

interface SendErrorResponse {
  success: false;
  error: string;
}

export type SendResponse = SendSuccessResponse | SendErrorResponse;

// ─── Server Action: Xác thực mật khẩu ─────────────────────────────────────────
// Request:  { "password": "user123" }
// Response: { "name": "User", "email": "abc@gmail.com", "type": "free" }

export async function authenticatePassword(
  password: string,
): Promise<AuthResponse> {
  const parsed = authSchema.safeParse({ password });

  if (!parsed.success) {
    const errorMsg =
      parsed.error.errors[0]?.message ?? "Mật khẩu không hợp lệ.";
    return { success: false, error: errorMsg };
  }

  if (API_BASE_URL) {
    try {
      const res = await fetch(getEndpointUrl("auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: parsed.data.password }),
      });

      if (!res.ok) {
        return { success: false, error: "Lỗi kết nối đến server." };
      }

      const data = await res.json();

      if (data.email && data.type) {
        return {
          success: true,
          name: data.name ?? "",
          email: data.email,
          type: data.type,
        };
      }

      return {
        success: false,
        error: data.error ?? "Mật khẩu không đúng. Vui lòng thử lại.",
      };
    } catch {
      return { success: false, error: "Không thể kết nối đến server." };
    }
  }

  const account = ACCOUNTS[parsed.data.password];

  if (!account) {
    return { success: false, error: "Mật khẩu không đúng. Vui lòng thử lại." };
  }

  return {
    success: true,
    name: account.name,
    email: account.email,
    type: account.type,
  };
}

// ─── Server Action: Xem trước email (Premium) ─────────────────────────────────
// Request:  { password, type, senderEmail, receiverEmail, subject, rawContent, targetlanguage }
// Response: { transformedContent }

export async function previewEmail(data: {
  password: string;
  type: UserType;
  senderEmail: string;
  receiverEmail: string;
  subject: string;
  rawContent: string;
  targetlanguage: string;
}): Promise<PreviewResponse> {
  const parsed = previewSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ." };
  }

  const {
    password,
    type,
    senderEmail,
    receiverEmail,
    subject,
    rawContent,
    targetlanguage,
  } = parsed.data;

  if (API_BASE_URL) {
    try {
      const res = await fetch(getEndpointUrl("preview"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          type,
          senderEmail,
          receiverEmail,
          subject,
          rawContent,
          targetlanguage,
        }),
      });

      if (!res.ok) {
        return { success: false, error: "Lỗi kết nối đến server." };
      }

      const result = await res.json();

      if (result.transformedContent) {
        return { success: true, transformedContent: result.transformedContent };
      }

      return {
        success: false,
        error: result.error ?? "Không thể xử lý nội dung.",
      };
    } catch {
      return { success: false, error: "Không thể kết nối đến server." };
    }
  }

  const account = ACCOUNTS[password];
  if (!account || account.email !== senderEmail || account.type !== type) {
    return { success: false, error: "Xác thực không hợp lệ." };
  }

  if (account.type !== "premium") {
    return {
      success: false,
      error: "Chức năng chỉ dành cho tài khoản Premium.",
    };
  }

  // TODO: Tích hợp dịch vụ dịch nội dung thực tế tại đây.
  const transformedContent = rawContent
    .split("\n")
    .map((line) => `[Translated] ${line}`)
    .join("\n");

  return { success: true, transformedContent };
}

// ─── Server Action: Gửi email ─────────────────────────────────────────────────
// Dùng cho: user "free" khi ấn "Gửi email", hoặc user "premium" sau khi xác nhận
// Request:  { password, type, senderEmail, receiverEmail, subject, transformedContent, targetlanguage }
// Response: { status, senderEmail, receiverEmail, subject, transformedContent, targetlanguage }

export async function sendEmail(data: {
  password: string;
  type: UserType;
  senderEmail: string;
  receiverEmail: string;
  subject: string;
  transformedContent: string;
  targetlanguage: string;
}): Promise<SendResponse> {
  const parsed = sendSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ." };
  }

  const {
    password,
    type,
    senderEmail,
    receiverEmail,
    subject,
    transformedContent,
    targetlanguage,
  } = parsed.data;

  if (API_BASE_URL) {
    try {
      const res = await fetch(getEndpointUrl("send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          type,
          senderEmail,
          receiverEmail,
          subject,
          transformedContent,
          targetlanguage,
        }),
      });

      if (!res.ok) {
        return { success: false, error: "Lỗi kết nối đến server." };
      }

      const result = await res.json();

      if (result.status === "sent") {
        return {
          success: true,
          status: result.status,
          senderEmail: result.senderEmail,
          receiverEmail: result.receiverEmail,
          subject: result.subject,
          transformedContent: result.transformedContent,
          targetlanguage: result.targetlanguage,
        };
      }

      return { success: false, error: result.error ?? "Không thể gửi email." };
    } catch {
      return { success: false, error: "Không thể kết nối đến server." };
    }
  }

  const account = ACCOUNTS[password];
  if (!account || account.email !== senderEmail || account.type !== type) {
    return { success: false, error: "Xác thực không hợp lệ." };
  }

  // TODO: Tích hợp dịch vụ gửi email thực tế (SendGrid, Resend, Nodemailer…) tại đây.

  return {
    success: true,
    status: "sent",
    senderEmail,
    receiverEmail,
    subject,
    transformedContent,
    targetlanguage,
  };
}
