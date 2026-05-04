"use server";

import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL ?? "";

const ENDPOINTS = {
  auth: "/api/auth",
  preview: "/api/email/preview",
  send: "/api/email/send",
} as const;

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

const ACCOUNTS: Record<string, AccountConfig> = {
  "free@12026": {
    name: "Free user",
    email: "free1@gmail.com",
    type: "free",
  },
  "pre@12026": {
    name: "Pre user",
    email: "pre1@gmail.com",
    type: "premium",
  },
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const authSchema = z.object({
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu.")
    .regex(/^(free|pre)/, "Mật khẩu không đúng"),
});

const previewSchema = z.object({
  password: z.string().min(1),
  receiverEmail: z.string().email(),
  subject: z.string().min(1),
  content: z.string().min(1),
  targetlanguage: z.string().min(1),
});

const sendSchema = z.object({
  password: z.string().min(1),
  receiverEmail: z.string().email(),
  subject: z.string().min(1),
  content: z.string().min(1),
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
  subject: string;
  content: string;
}

interface PreviewErrorResponse {
  success: false;
  error: string;
}

export type PreviewResponse = PreviewSuccessResponse | PreviewErrorResponse;

interface SendSuccessResponse {
  success: true;
  status: string;
  sender: string;
  senderEmail: string;
  receiverEmail: string;
  subject: string;
  content: string;
  targetLanguage: string;
}

interface SendErrorResponse {
  success: false;
  error: string;
}

export type SendResponse = SendSuccessResponse | SendErrorResponse;

// ─── Server Action: Xác thực mật khẩu ─────────────────────────────────────────
// POST /api/auth

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
      console.log("auth", res);
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

// POST /api/email/preview

export async function previewEmail(data: {
  password: string;
  receiverEmail: string;
  subject: string;
  content: string;
  targetlanguage: string;
}): Promise<PreviewResponse> {
  const parsed = previewSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ." };
  }

  if (API_BASE_URL) {
    try {
      const res = await fetch(getEndpointUrl("preview"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        return { success: false, error: "Lỗi kết nối đến server." };
      }

      const result = await res.json();

      if (result.content) {
        return {
          success: true,
          subject: result.subject ?? parsed.data.subject,
          content: result.content,
        };
      }

      return {
        success: false,
        error: result.error ?? "Không thể xử lý nội dung.",
      };
    } catch {
      return { success: false, error: "Không thể kết nối đến server." };
    }
  }

  const account = ACCOUNTS[parsed.data.password];
  if (!account) {
    return { success: false, error: "Xác thực không hợp lệ." };
  }
  if (account.type !== "premium") {
    return {
      success: false,
      error: "Chức năng chỉ dành cho tài khoản Premium.",
    };
  }

  // TODO: Tích hợp dịch vụ dịch nội dung thực tế tại đây.
  const translatedContent = parsed.data.content
    .split("\n")
    .map((line) => `[Translated] ${line}`)
    .join("\n");

  return {
    success: true,
    subject: `[Translated] ${parsed.data.subject}`,
    content: translatedContent,
  };
}

// POST /api/email/send

export async function sendEmail(data: {
  password: string;
  receiverEmail: string;
  subject: string;
  content: string;
  targetlanguage: string;
}): Promise<SendResponse> {
  const parsed = sendSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ." };
  }

  if (API_BASE_URL) {
    try {
      const res = await fetch(getEndpointUrl("send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        return { success: false, error: "Lỗi kết nối đến server." };
      }

      const result = await res.json();

      if (result.status === "sent") {
        return {
          success: true,
          status: result.status,
          sender: result.sender ?? "",
          senderEmail: result.senderEmail,
          receiverEmail: result.receiverEmail,
          subject: result.subject,
          content: result.content,
          targetLanguage: result.targetLanguage,
        };
      }

      return { success: false, error: result.error ?? "Không thể gửi email." };
    } catch {
      return { success: false, error: "Không thể kết nối đến server." };
    }
  }

  const account = ACCOUNTS[parsed.data.password];
  if (!account) {
    return { success: false, error: "Xác thực không hợp lệ." };
  }

  return {
    success: true,
    status: "sent",
    sender: account.name,
    senderEmail: account.email,
    receiverEmail: parsed.data.receiverEmail,
    subject: parsed.data.subject,
    content: parsed.data.content,
    targetLanguage: parsed.data.targetlanguage,
  };
}
