"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Send, RotateCcw, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import {
  authenticatePassword,
  previewEmail,
  sendEmail,
  type UserType,
} from "@/app/actions";

// ─── Language list ────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: "vi", label: "Vietnamese" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
];

// ─── Schemas ──────────────────────────────────────────────────────────────────

const passwordSchema = z.object({
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

const emailSchema = z.object({
  receiverEmail: z
    .string()
    .min(1, "Vui lòng nhập email người nhận.")
    .email("Email người nhận không hợp lệ."),
  language: z.string().min(1, "Vui lòng chọn ngôn ngữ."),
  subject: z
    .string()
    .min(1, "Vui lòng nhập tiêu đề email.")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự."),
  content: z
    .string()
    .min(1, "Vui lòng nhập nội dung email.")
    .max(5000, "Nội dung không được vượt quá 5000 ký tự."),
});

type PasswordValues = z.infer<typeof passwordSchema>;
type EmailValues = z.infer<typeof emailSchema>;

// ─── State types ──────────────────────────────────────────────────────────────

interface AuthedAccount {
  password: string;
  name: string;
  email: string;
  type: UserType;
}

interface PreviewData {
  password: string;
  receiverEmail: string;
  subject: string;
  content: string;
  targetlanguage: string;
}

interface SentData {
  status: string;
  sender: string;
  senderEmail: string;
  receiverEmail: string;
  subject: string;
  content: string;
  targetLanguage: string;
}

// ─── Reusable info row ────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <>
      <div
        className={
          multiline ? "flex flex-col gap-1" : "flex justify-between gap-4"
        }
      >
        <span className='text-muted-foreground shrink-0'>{label}</span>
        {multiline ? (
          <p className='text-foreground whitespace-pre-wrap break-words'>
            {value}
          </p>
        ) : (
          <span className='font-medium text-right truncate'>{value}</span>
        )}
      </div>
      <Separator />
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmailForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [account, setAccount] = useState<AuthedAccount | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [sent, setSent] = useState<SentData | null>(null);
  // const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      receiverEmail: "",
      language: "",
      subject: "",
      content: "",
    },
  });

  const isUnlocked = account !== null;
  const watchedPassword = passwordForm.watch("password");
  const watchedContent = emailForm.watch("content");

  // ─── Xác thực mật khẩu ───────────────────────────────────────────────────

  const onPwdSubmit = async (values: PasswordValues) => {
    setApiError(null);
    const result = await authenticatePassword(values.password);
    if (!result.success) {
      passwordForm.setError("password", {
        message:
          result.error === "1"
            ? "Mật khẩu không đúng. Vui lòng thử lại."
            : result.error,
      });
      return;
    }
    setAccount({
      password: values.password,
      name: result.name,
      email: result.email,
      type: result.type,
    });
    setShowPassword(false);
  };

  // ─── Submit email form ────────────────────────────────────────────────────

  const onEmailSubmit = async (values: EmailValues) => {
    if (!account) return;
    setApiError(null);

    if (account.type === "premium") {
      // Gọi preview trước khi gửi
      const result = await previewEmail({
        password: account.password,
        receiverEmail: values.receiverEmail,
        subject: values.subject,
        content: values.content,
        targetlanguage: values.language,
      });
      if (!result.success) {
        setApiError(
          result.error === "11"
            ? "Nội dung xem trước không lấy được. Vui lòng thử lại."
            : result.error,
        );
        return;
      }
      setPreview({
        password: account.password,
        receiverEmail: values.receiverEmail,
        subject: result.subject,
        content: result.content,
        targetlanguage: values.language,
      });
    } else {
      // Free: gửi thẳng
      const result = await sendEmail({
        password: account.password,
        receiverEmail: values.receiverEmail,
        subject: values.subject,
        content: values.content,
        targetlanguage: values.language,
      });
      if (!result.success) {
        setApiError(
          result.error === "11"
            ? "Gửi email không thành công. Vui lòng thử lại."
            : result.error,
        );
        return;
      }
      setSent({
        status: result.status,
        sender: result.sender,
        senderEmail: result.senderEmail,
        receiverEmail: result.receiverEmail,
        subject: result.subject,
        content: result.content,
        targetLanguage: result.targetLanguage,
      });
    }
  };

  // ─── Xác nhận gửi (premium) ──────────────────────────────────────────────

  const handleConfirmSend = async () => {
    if (!preview) return;
    setApiError(null);
    const result = await sendEmail(preview);
    if (!result.success) {
      setApiError(
        result.error === "11"
          ? "Gửi email không thành công. Vui lòng thử lại."
          : result.error,
      );
      return;
    }
    setSent({
      status: result.status,
      sender: result.sender,
      senderEmail: result.senderEmail,
      receiverEmail: result.receiverEmail,
      subject: result.subject,
      content: result.content,
      targetLanguage: result.targetLanguage,
    });
    setPreview(null);
  };

  const handleReset = () => {
    setAccount(null);
    setPreview(null);
    setSent(null);
    setApiError(null);
    setShowPassword(false);
    passwordForm.reset();
    emailForm.reset();
  };

  const handleResend = () => {
    setPreview(null);
    setSent(null);
    setApiError(null);
    setShowPassword(false);
    emailForm.reset();
  };
  // ─── Màn hình đã gửi ─────────────────────────────────────────────────────

  if (sent) {
    return (
      <main className='min-h-screen flex items-center justify-center p-6'>
        <Card className='w-full max-w-lg'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
              <Send className='h-6 w-6 text-foreground' />
            </div>
            <CardTitle className='text-2xl'>Email đã được gửi!</CardTitle>
            <CardDescription>
              Email gửi đến{" "}
              <span className='font-medium text-foreground'>
                {sent.receiverEmail}
              </span>{" "}
              thành công.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 rounded-lg border bg-muted/50 mx-6 p-4 text-sm'>
            <InfoRow
              label='Người gửi'
              value={`${sent.sender} <${sent.senderEmail}>`}
            />
            <InfoRow label='Người nhận' value={sent.receiverEmail} />
            <InfoRow label='Tiêu đề' value={sent.subject} />
            <InfoRow
              label='Ngôn ngữ'
              value={
                LANGUAGES.find((l) => l.value === sent.targetLanguage)?.label ??
                sent.targetLanguage
              }
            />
            <div className='flex flex-col gap-1'>
              <span className='text-muted-foreground'>Nội dung</span>
              <p className='text-foreground whitespace-pre-wrap break-words'>
                {sent.content}
              </p>
            </div>
          </CardContent>
          <CardFooter className='mt-2'>
            <Button
              variant='outline'
              className='w-full gap-2'
              onClick={handleResend}
            >
              <RotateCcw className='h-4 w-4' />
              Gửi email khác
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  // ─── Main Form ────────────────────────────────────────────────────────────

  return (
    <main className='min-h-screen flex items-center justify-center p-6'>
      <div className='w-full max-w-lg space-y-4'>
        {/* Card 1: Xác thực mật khẩu */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Lock className='h-4 w-4' />
              Xác thực mật khẩu
            </CardTitle>
            <CardDescription>
              Nhập mật khẩu để xác định email người gửi.
            </CardDescription>
          </CardHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPwdSubmit)}>
              <CardContent className='space-y-3'>
                <FormField
                  control={passwordForm.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <div className='flex gap-2'>
                        <div className='relative flex-1'>
                          <FormControl>
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder='Nhập mật khẩu...'
                              disabled={isUnlocked}
                              className='pr-10'
                              onChange={(e) => {
                                field.onChange(e);
                                if (passwordForm.formState.errors.password) {
                                  passwordForm.clearErrors("password");
                                }
                              }}
                            />
                          </FormControl>
                          <button
                            type='button'
                            onClick={() => setShowPassword((v) => !v)}
                            disabled={isUnlocked}
                            className='absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground disabled:opacity-40'
                            aria-label={
                              showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </button>
                        </div>
                        <Button
                          type='submit'
                          disabled={
                            isUnlocked ||
                            !watchedPassword ||
                            passwordForm.formState.isSubmitting ||
                            passwordForm.formState.isLoading
                          }
                          className='shrink-0 gap-1.5'
                        >
                          {isUnlocked ? (
                            <>
                              <CheckCircle className='h-4 w-4' />
                              Đã xác thực
                            </>
                          ) : passwordForm.formState.isSubmitting ||
                            passwordForm.formState.isLoading ? (
                            "Đang kiểm tra..."
                          ) : (
                            <>
                              <Lock className='h-4 w-4' />
                              Xác thực
                            </>
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isUnlocked && account && (
                  <div className='flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm'>
                    <span className='text-muted-foreground'>
                      Email người gửi
                    </span>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={
                          account.type === "premium" ? "default" : "secondary"
                        }
                      >
                        {account.type === "premium" ? "Premium" : "Free"}
                      </Badge>
                      <span className='font-medium'>
                        {account.name} &lt;{account.email}&gt;
                      </span>
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
            <CardTitle className='text-xl tracking-tight'>Soạn email</CardTitle>
            <CardDescription>
              {isUnlocked
                ? "Điền thông tin bên dưới để gửi email đến người nhận."
                : "Xác thực mật khẩu ở trên để bắt đầu soạn email."}
            </CardDescription>
          </CardHeader>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              <CardContent className='space-y-4'>
                <FormField
                  control={emailForm.control}
                  name='receiverEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email người nhận</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='email'
                          placeholder='recipient@domain.com'
                          disabled={!isUnlocked}
                          autoComplete='email'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name='language'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngôn ngữ</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!isUnlocked}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Chọn ngôn ngữ...' />
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
                  name='subject'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu đề email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='text'
                          placeholder='Nhập tiêu đề email...'
                          disabled={!isUnlocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name='content'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nội dung email</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='Nhập nội dung email của bạn tại đây...'
                          rows={10}
                          disabled={!isUnlocked}
                          className='resize-y'
                        />
                      </FormControl>
                      <div className='flex justify-between items-center'>
                        <FormMessage />
                        <span className='text-xs text-muted-foreground ml-auto'>
                          {watchedContent.length}/5000
                        </span>
                      </div>
                    </FormItem>
                  )}
                />

                {apiError && (
                  <p className='text-sm text-destructive'>{apiError}</p>
                )}
              </CardContent>

              <CardFooter className='flex gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  className='flex-1 gap-2'
                  onClick={handleReset}
                >
                  <RotateCcw className='h-4 w-4' />
                  Xóa trang
                </Button>
                <Button
                  type='submit'
                  disabled={
                    !isUnlocked ||
                    emailForm.formState.isSubmitting ||
                    emailForm.formState.isLoading
                  }
                  className='flex-1 gap-2'
                >
                  <Send className='h-4 w-4' />
                  {emailForm.formState.isSubmitting ||
                  emailForm.formState.isLoading
                    ? "Đang xử lý..."
                    : account?.type === "premium"
                      ? "Xem trước"
                      : "Gửi email"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Card 3: Xem trước — chỉ Premium, hiển thị ngay dưới form */}
        {preview && (
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base tracking-tight'>
                  Xem trước email
                </CardTitle>
                <Badge variant='secondary'>Premium</Badge>
              </div>
              <CardDescription>
                Kiểm tra lại nội dung trước khi gửi đi.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3 rounded-lg border bg-muted/50 mx-6 p-4 text-sm'>
              <InfoRow label='Người nhận' value={preview.receiverEmail} />
              <InfoRow label='Tiêu đề' value={preview.subject} />
              <InfoRow
                label='Ngôn ngữ'
                value={
                  LANGUAGES.find((l) => l.value === preview.targetlanguage)
                    ?.label ?? preview.targetlanguage
                }
              />
              <div className='flex flex-col gap-1'>
                <span className='text-muted-foreground'>Nội dung đã xử lý</span>
                <p className='text-foreground whitespace-pre-wrap break-words'>
                  {preview.content}
                </p>
              </div>
            </CardContent>
            {apiError && (
              <p className='px-6 pt-2 text-sm text-destructive'>{apiError}</p>
            )}
            <CardFooter className='mt-2'>
              <Button
                className='w-full gap-2'
                disabled={
                  emailForm.formState.isSubmitting ||
                  emailForm.formState.isLoading
                }
                onClick={handleConfirmSend}
              >
                <Send className='h-4 w-4' />
                {emailForm.formState.isSubmitting ||
                emailForm.formState.isLoading
                  ? "Đang gửi..."
                  : "Xác nhận gửi"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  );
}
