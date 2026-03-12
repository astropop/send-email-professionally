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
import { Send, RotateCcw } from "lucide-react"

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

export default function EmailForm() {
  const [email, setEmail] = useState("")
  const [language, setLanguage] = useState("")
  const [content, setContent] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleReset = () => {
    setEmail("")
    setLanguage("")
    setContent("")
    setSubmitted(false)
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
              Email đã được gửi thành công đến{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 rounded-lg border bg-muted/50 mx-6 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Người nhận</span>
              <span className="font-medium text-right truncate">{email}</span>
            </div>
            <div className="border-t" />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Ngôn ngữ</span>
              <span className="font-medium">
                {LANGUAGES.find((l) => l.value === language)?.label ?? language}
              </span>
            </div>
            <div className="border-t" />
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

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email người nhận{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              <Select
                value={language}
                onValueChange={setLanguage}
                required
              >
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
              disabled={!email || !language || !content}
            >
              <Send className="h-4 w-4" />
              Gửi email
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
