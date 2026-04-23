"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Separator } from "@/components/ui/separator"
import { Send, RotateCcw, Lock, Eye, EyeOff } from "lucide-react"

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

const CORRECT_PASSWORD = "admin123"

export default function EmailForm() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)

  const [senderEmail, setSenderEmail] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [language, setLanguage] = useState("")
  const [content, setContent] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      setPasswordError("")
      setIsUnlocked(true)
    } else {
      setPasswordError("Mật khẩu không đúng. Vui lòng thử lại.")
      setPassword("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleReset = () => {
    setSenderEmail("")
    setRecipientEmail("")
    setLanguage("")
    setContent("")
    setSubmitted(false)
    setIsUnlocked(false)
    setPassword("")
    setPasswordError("")
    setShowPassword(false)
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Email đã được gửi!</CardTitle>
            <CardDescription>
              Email gửi đến{" "}
              <span className="font-medium text-foreground">{recipientEmail}</span>{" "}
              thành công.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 rounded-lg border bg-muted/50 mx-6 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Người gửi</span>
              <span className="font-medium text-right truncate">{senderEmail}</span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Người nhận</span>
              <span className="font-medium text-right truncate">{recipientEmail}</span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ngôn ngữ</span>
              <span className="font-medium">
                {LANGUAGES.find((l) => l.value === language)?.label ?? language}
              </span>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Nội dung</span>
              <p className="text-foreground whitespace-pre-wrap break-words">{content}</p>
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

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Soạn email</CardTitle>
          <CardDescription>
            Điền thông tin bên dưới để gửi email đến người nhận.
          </CardDescription>
        </CardHeader>

        <form onSubmit={isUnlocked ? handleSubmit : handlePasswordSubmit}>
          <CardContent className="space-y-5">

            {/* Password section */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Mật khẩu xác thực
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu để mở khoá..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError("")
                  }}
                  disabled={isUnlocked}
                  required
                  className="pr-10"
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isUnlocked}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground disabled:opacity-40"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-xs text-destructive">
                  {passwordError}
                </p>
              )}
              {isUnlocked && (
                <p className="text-xs text-muted-foreground">
                  Xác thực thành cong. Email người gửi đã được mở khoá.
                </p>
              )}
            </div>

            {/* Sender Email — only shown when unlocked */}
            {isUnlocked && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="sender-email">
                    Email người gửi{" "}
                    <span className="text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="sender-email"
                    type="email"
                    placeholder="sender@domain.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </>
            )}

            <Separator />

            {/* Recipient Email */}
            <div className="space-y-2">
              <Label htmlFor="recipient-email">
                Email người nhận{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="recipient@domain.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">
                Ngôn ngữ{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Select value={language} onValueChange={setLanguage} required>
                <SelectTrigger id="language" className="w-full">
                  <SelectValue placeholder="Chọn ngôn ngữ..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">
                Nội dung email{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Nhập nội dung email của bạn tại đây..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length} ký tự
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex gap-3">
            {!isUnlocked ? (
              <Button type="submit" className="w-full gap-2" disabled={!password}>
                <Lock className="h-4 w-4" />
                Xác thực mật khẩu
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  Xóa trắng
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={!senderEmail || !recipientEmail || !language || !content}
                >
                  <Send className="h-4 w-4" />
                  Gửi email
                </Button>
              </>
            )}
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
