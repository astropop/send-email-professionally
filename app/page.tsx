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
import { Badge } from "@/components/ui/badge"
import { Send, RotateCcw, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import {
  authenticatePassword,
  previewEmail,
  sendEmail,
  type UserType,
} from "@/app/actions"

// ─── Language list ────────────────────────────────────────────────────────────

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
    .regex(/^(admin|user)/, "Mật khẩu phải bắt đầu bằng 'admin' hoặc 'user'."),
})

const emailSchema = z.object({
  receiverEmail: z
    .string()
    .min(1, "Vui lòng nhập email người nhận.")
    .email("Email người nhận không hợp lệ."),
  language: z.string().min(1, "Vui lòng chọn ngôn ngữ."),
  content: z
    .string()
    .min(1, "Vui lòng nhập nội dung email.")
    .max(5000, "Nội dung không được vượt quá 5000 ký tự."),
})

type PasswordValues = z.infer<typeof passwordSchema>
type EmailValues = z.infer<typeof emailSchema>

// ─── State types ──────────────────────────────────────────────────────────────

interface AuthedAccount {
  password: string
  email: string
  type: UserType
}

interface PreviewData {
  password: string
  type: UserType
  senderEmail: string
  receiverEmail: string
  transformedContent: string
  targetlanguage: string
}

interface SentData extends PreviewData {
  status: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmailForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [account, setAccount] = useState<AuthedAccount | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [sent, setSent] = useState<SentData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  })

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { receiverEmail: "", language: "", content: "" },
  })

  const isUnlocked = account !== null
  const watchedPassword = passwordForm.watch("password")
  const watchedContent = emailForm.watch("content")

  // ─── Xác thực mật khẩu → Server Action ───────────────────────────────────

  const onPasswordSubmit = async (values: PasswordValues) => {
    setIsLoading(true)
    setApiError(null)
    const result = await authenticatePassword(values.password)
    if (!result.success) {
      passwordForm.setError("password", { message: result.error })
    } else {
      setAccount({
        password: values.password,
        email: result.email,
        type: result.type,
      })
    }
    setIsLoading(false)
  }

  // ─── Submit email form ────────────────────────────────────────────────────
  // Premium → Server Action previewEmail → hiện màn hình xem trước
  // Free    → Server Action sendEmail   → gửi luôn

  const onEmailSubmit = async (values: EmailValues) => {
    if (!account) return
    setIsLoading(true)
    setApiError(null)

    if (account.type === "premium") {
      const result = await previewEmail({
        password: account.password,
        type: account.type,
        senderEmail: account.email,
        receiverEmail: values.receiverEmail,
        rawContent: values.content,
        targetlanguage: values.language,
      })
      if (!result.success) {
        setApiError(result.error)
      } else {
        setPreview({
          password: account.password,
          type: account.type,
          senderEmail: account.email,
          receiverEmail: values.receiverEmail,
          transformedContent: result.transformedContent,
          targetlanguage: values.language,
        })
      }
    } else {
      const result = await sendEmail({
        password: account.password,
        type: account.type,
        senderEmail: account.email,
        receiverEmail: values.receiverEmail,
        transformedContent: values.content,
        targetlanguage: values.language,
      })
      if (!result.success) {
        setApiError(result.error)
      } else {
        setSent({
          password: account.password,
          type: account.type,
          senderEmail: result.senderEmail,
          receiverEmail: result.receiverEmail,
          transformedContent: result.transformedContent,
          targetlanguage: result.targetlanguage,
          status: result.status,
        })
      }
    }
    setIsLoading(false)
  }

  // ─── Xác nhận gửi (premium) → Server Action ──────────────────────────────

  const handleConfirmSend = async () => {
    if (!preview) return
    setIsLoading(true)
    setApiError(null)
    const result = await sendEmail(preview)
    if (!result.success) {
      setApiError(result.error)
    } else {
      setSent({
        password: preview.password,
        type: preview.type,
        senderEmail: result.senderEmail,
        receiverEmail: result.receiverEmail,
        transformedContent: result.transformedContent,
        targetlanguage: result.targetlanguage,
        status: result.status,
      })
    }
    setIsLoading(false)
  }

  const handleReset = () => {
    setAccount(null)
    setPreview(null)
    setSent(null)
    setApiError(null)
    setShowPassword(false)
    passwordForm.reset()
    emailForm.reset()
  }

  // ─── Màn hình đã gửi ─────────────────────────────────────────────────────

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Send className="h-6 w-6 text-foreground" />
            </div>
            <CardTitle className="text-2xl">Email da duoc gui!</CardTitle>
            <CardDescription>
              Email gui den{" "}
              <span className="font-medium text-foreground">
                {sent.receiverEmail}
              </span>{" "}
              thanh cong.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 rounded-lg border bg-muted/50 mx-6 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Nguoi gui</span>
              <span className="font-medium text-right truncate">
                {sent.senderEmail}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Nguoi nhan</span>
              <span className="font-medium text-right truncate">
                {sent.receiverEmail}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ngon ngu</span>
              <span className="font-medium">
                {LANGUAGES.find((l) => l.value === sent.targetlanguage)
                  ?.label ?? sent.targetlanguage}
              </span>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Noi dung</span>
              <p className="text-foreground whitespace-pre-wrap break-words">
                {sent.transformedContent}
              </p>
            </div>
          </CardContent>
          <CardFooter className="mt-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Gui email khac
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  // ─── Màn hình xem trước (premium) ────────────────────────────────────────

  if (preview) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl tracking-tight">
                Xem truoc email
              </CardTitle>
              <Badge variant="secondary">Premium</Badge>
            </div>
            <CardDescription>
              Kiem tra lai noi dung truoc khi gui di.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 rounded-lg border bg-muted/50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Nguoi gui</span>
              <span className="font-medium text-right truncate">
                {preview.senderEmail}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Nguoi nhan</span>
              <span className="font-medium text-right truncate">
                {preview.receiverEmail}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ngon ngu</span>
              <span className="font-medium">
                {LANGUAGES.find((l) => l.value === preview.targetlanguage)
                  ?.label ?? preview.targetlanguage}
              </span>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Noi dung da xu ly</span>
              <p className="text-foreground whitespace-pre-wrap break-words">
                {preview.transformedContent}
              </p>
            </div>
          </CardContent>
          {apiError && (
            <p className="px-6 text-sm text-destructive">{apiError}</p>
          )}
          <CardFooter className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              disabled={isLoading}
              onClick={() => {
                setPreview(null)
                setApiError(null)
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Sua lai
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={isLoading}
              onClick={handleConfirmSend}
            >
              <Send className="h-4 w-4" />
              {isLoading ? "Dang gui..." : "Xac nhan gui"}
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  // ─── Main Form ────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-4">
        {/* Card 1: Xác thực mật khẩu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" />
              Xac thuc mat khau
            </CardTitle>
            <CardDescription>
              Nhap mat khau de xac dinh email nguoi gui.
            </CardDescription>
          </CardHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <CardContent className="space-y-3">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mat khau</FormLabel>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Nhap mat khau..."
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
                            aria-label={
                              showPassword ? "An mat khau" : "Hien mat khau"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <Button
                          type="submit"
                          disabled={isUnlocked || !watchedPassword || isLoading}
                          className="shrink-0 gap-1.5"
                        >
                          {isUnlocked ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Da xac thuc
                            </>
                          ) : isLoading ? (
                            "Dang kiem tra..."
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              Xac thuc
                            </>
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isUnlocked && account && (
                  <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">
                      Email nguoi gui
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          account.type === "premium" ? "default" : "secondary"
                        }
                      >
                        {account.type === "premium" ? "Premium" : "Free"}
                      </Badge>
                      <span className="font-medium">{account.email}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </form>
          </Form>
        </Card>

        {/* Card 2: Soạn email */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl tracking-tight">Soan email</CardTitle>
            <CardDescription>
              {isUnlocked
                ? "Dien thong tin ben duoi de gui email den nguoi nhan."
                : "Xac thuc mat khau o tren de bat dau soan email."}
            </CardDescription>
          </CardHeader>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="receiverEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email nguoi nhan</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="recipient@domain.com"
                          disabled={!isUnlocked}
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngon ngu</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!isUnlocked}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chon ngon ngu..." />
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

                <FormField
                  control={emailForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Noi dung email</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Nhap noi dung email cua ban tai day..."
                          rows={6}
                          disabled={!isUnlocked}
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

                {apiError && (
                  <p className="text-sm text-destructive">{apiError}</p>
                )}
              </CardContent>

              <CardFooter className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  Xoa trang
                </Button>
                <Button
                  type="submit"
                  disabled={!isUnlocked || isLoading}
                  className="flex-1 gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isLoading
                    ? "Dang xu ly..."
                    : account?.type === "premium"
                      ? "Xem truoc"
                      : "Gui email"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </main>
  )
}
