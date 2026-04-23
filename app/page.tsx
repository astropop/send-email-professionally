"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Send, RotateCcw, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

const CORRECT_PASSWORD = "admin123"

const LANGUAGES = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "zh", label: "中文" },
]

// ─── Schemas ──────────────────────────────────────────────────────────────────

const passwordSchema = z.object({
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu.")
    .refine((val) => val === CORRECT_PASSWORD, "Mật khẩu không đúng. Vui lòng thử lại."),
})

const emailSchema = z.object({
  senderEmail: z.string().min(1, "Vui lòng nhập email người gửi.").email("Email người gửi không hợp lệ."),
  recipientEmail: z.string().min(1, "Vui lòng nhập email người nhận.").email("Email người nhận không hợp lệ."),
  language: z.string().min(1, "Vui lòng chọn ngôn ngữ."),
  content: z.string().min(1, "Vui lòng nhập nội dung email.").max(5000, "Nội dung không được vượt quá 5000 ký tự."),
})

type PasswordValues = z.infer<typeof passwordSchema>
type EmailValues = z.infer<typeof emailSchema>

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmailForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<EmailValues | null>(null)

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  })

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      senderEmail: "",
      recipientEmail: "",
      language: "",
      content: "",
    },
  })

  const onPasswordSubmit = (_values: PasswordValues) => {
    setIsUnlocked(true)
  }

  const onEmailSubmit = (values: EmailValues) => {
    setSubmittedData(values)
    setSubmitted(true)
  }

  const handleReset = () => {
    setIsUnlocked(false)
    setSubmitted(false)
    setSubmittedData(null)
    setShowPassword(false)
    passwordForm.reset()
    emailForm.reset()
  }

  const watchedPassword = passwordForm.watch("password")
  const watchedContent = emailForm.watch("content")

  // ─── Success Screen ─────────────────────────────────────────────────────────

  if (submitted && submittedData) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Send className="h-6 w-6 text-foreground" />
            </div>
            <CardTitle className="text-2xl">Email đã được gửi!</CardTitle>
            <CardDescription>
              Email gửi đến{" "}
              <span className="font-medium text-foreground">{submittedData.recipientEmail}</span>{" "}
              thành công.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 rounded-lg border bg-muted/50 mx-6 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Người gửi</span>
              <span className="font-medium text-right truncate">{submittedData.senderEmail}</span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Người nhận</span>
              <span className="font-medium text-right truncate">{submittedData.recipientEmail}</span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ngôn ngữ</span>
              <span className="font-medium">
                {LANGUAGES.find((l) => l.value === submittedData.language)?.label}
              </span>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Nội dung</span>
              <p className="text-foreground whitespace-pre-wrap break-words">{submittedData.content}</p>
            </div>
          </CardContent>
          <CardFooter className="mt-2">
            <Button variant="outline" className="w-full gap-2" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              Gửi email khác
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  // ─── Main Form ──────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-4">

        {/* ── Card 1: Xác thực mật khẩu ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" />
              Xác thực mật khẩu
            </CardTitle>
            <CardDescription>
              Nhập mật khẩu để mở khoá ô email người gửi.
            </CardDescription>
          </CardHeader>

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <CardContent>
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu..."
                              disabled={isUnlocked}
                              className="pr-10"
                              onChange={(e) => {
                                field.onChange(e)
                                if (passwordForm.formState.errors.password) {
                                  passwordForm.clearErrors("password")
                                }
                              }}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            disabled={isUnlocked}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground disabled:opacity-40"
                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          >
                            {showPassword
                              ? <EyeOff className="h-4 w-4" />
                              : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <Button
                          type="submit"
                          disabled={isUnlocked || !watchedPassword}
                          className="shrink-0 gap-1.5"
                        >
                          {isUnlocked
                            ? <><CheckCircle className="h-4 w-4" />Đã xác thực</>
                            : <><Lock className="h-4 w-4" />Xác thực</>
                          }
                        </Button>
                      </div>
                      <FormMessage />
                      {isUnlocked && (
                        <p className="text-xs text-muted-foreground pt-0.5">
                          Xác thực thành công. Email người gửi đã được mở khoá.
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </form>
          </Form>
        </Card>

        {/* ── Card 2: Soạn email ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl tracking-tight">Soạn email</CardTitle>
            <CardDescription>
              Điền thông tin bên dưới để gửi email đến người nhận.
            </CardDescription>
          </CardHeader>

          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              <CardContent className="space-y-4">

                {/* Sender Email */}
                <FormField
                  control={emailForm.control}
                  name="senderEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email người gửi</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="sender@domain.com"
                          disabled={!isUnlocked}
                          autoComplete="email"
                        />
                      </FormControl>
                      {!isUnlocked && (
                        <p className="text-xs text-muted-foreground">
                          Xác thực mật khẩu ở trên để nhập email người gửi.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Recipient Email */}
                <FormField
                  control={emailForm.control}
                  name="recipientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email người nhận</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="recipient@domain.com"
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={emailForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngôn ngữ</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn ngôn ngữ..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content */}
                <FormField
                  control={emailForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nội dung email</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Nhập nội dung email của bạn tại đây..."
                          rows={6}
                          className="resize-y"
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground ml-auto">
                          {watchedContent.length}/5000
                        </span>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Xóa trắng
                </Button>
                <Button type="submit" className="flex-1 gap-2">
                  <Send className="h-4 w-4" />
                  Gửi email
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

      </div>
    </main>
  )
}
