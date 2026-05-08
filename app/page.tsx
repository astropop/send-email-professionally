"use client";

import Image from "next/image";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
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

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import {
  authenticatePassword,
  previewEmail,
  sendEmail,
  type UserType,
} from "@/app/actions";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

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
  password: z
    .string()
    .min(1, "Please enter your password")
    .regex(/^(free|pre)/, "Invalid password format"),
});

const emailSchema = z.object({
  receiverEmail: z
    .string()
    .min(1, "Please enter recipient email.")
    .email("Invalid recipient email."),
  language: z.string().min(1, "Please select a language."),
  subject: z
    .string()
    .min(1, "Please enter email subject.")
    .max(200, "Subject must not exceed 200 characters."),
  content: z
    .string()
    .min(1, "Please enter email content.")
    .max(5000, "Content must not exceed 5000 characters."),
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

// ─── Usage Guide Component ────────────────────────────────────────────────────

function UsageGuide() {
  return (
    <Card className='sticky top-6'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <HelpCircle className='h-4 w-4' />
          How to Use
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 text-sm'>
        <div>
          <h4 className='font-medium mb-1'>1. Authenticate</h4>
          <p className='text-muted-foreground'>
            Enter your password to verify your sender identity. Your email
            address will be automatically assigned based on your credentials.
          </p>
        </div>
        <Separator />
        <div>
          <h4 className='font-medium mb-1'>2. Compose Email</h4>
          <p className='text-muted-foreground'>
            Fill in recipient email, select target language, enter subject and
            content. AI will help beautify your email.
          </p>
        </div>
        <Separator />
        <div>
          <h4 className='font-medium mb-1'>3. Preview & Send</h4>
          <p className='text-muted-foreground'>
            <strong>Premium users:</strong> Preview AI-enhanced content before
            sending.
            <br />
            <strong>Free users:</strong> Email sends directly after composing.
          </p>
        </div>
        <Separator />
        <div className='rounded-md bg-muted/50 p-3'>
          <h4 className='font-medium mb-1 flex items-center gap-1.5'>
            <Sparkles className='h-3.5 w-3.5 text-primary' />
            AI Features
          </h4>
          <ul className='text-muted-foreground space-y-1 list-disc list-inside'>
            <li>Auto-translate to selected language</li>
            <li>Professional email formatting</li>
            <li>Grammar and tone improvement</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmailForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [account, setAccount] = useState<AuthedAccount | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [sent, setSent] = useState<SentData | null>(null);
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

  // ─── Authenticate password ───────────────────────────────────────────────

  const onPwdSubmit = async (values: PasswordValues) => {
    setApiError(null);
    const result = await authenticatePassword(values.password);
    if (!result.success) {
      passwordForm.setError("password", {
        message:
          result.error === "1"
            ? "Invalid password. Please try again."
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
            ? "Failed to get preview. Please try again."
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
            ? "Failed to send email. Please try again."
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

  // ─── Confirm send (premium) ──────────────────────────────────────────────

  const handleConfirmSend = async () => {
    if (!preview) return;
    setApiError(null);
    const result = await sendEmail(preview);
    if (!result.success) {
      setApiError(
        result.error === "11"
          ? "Failed to send email. Please try again."
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

  // ─── Sent screen ─────────────────────────────────────────────────────────

  if (sent) {
    return (
      <div className='min-h-screen flex flex-col'>
        {/* Banner */}
        <header className='border-b bg-card'>
          <div className='container mx-auto px-4 py-3 flex items-center justify-center gap-2'>
            <Sparkles className='h-5 w-5 text-primary' />
            <span className='font-semibold text-lg'>
              Emaily = Email + Beautify + AI
            </span>
          </div>
        </header>

        <main className='flex-1 flex items-center justify-center p-6'>
          <Card className='w-full max-w-lg'>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10'>
                <Send className='h-6 w-6 text-primary' />
              </div>
              <CardTitle className='text-2xl'>Email Sent!</CardTitle>
              <CardDescription>
                Email to{" "}
                <span className='font-medium text-foreground'>
                  {sent.receiverEmail}
                </span>{" "}
                was sent successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3 rounded-lg border bg-muted/50 mx-6 p-4 text-sm'>
              <InfoRow
                label='Sender'
                value={`${sent.sender} <${sent.senderEmail}>`}
              />
              <InfoRow label='Recipient' value={sent.receiverEmail} />
              <InfoRow label='Subject' value={sent.subject} />
              <InfoRow
                label='Language'
                value={
                  LANGUAGES.find((l) => l.value === sent.targetLanguage)
                    ?.label ?? sent.targetLanguage
                }
              />
              <div className='flex flex-col gap-1'>
                <span className='text-muted-foreground'>Content</span>
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
                Send Another Email
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  // ─── Main Form ────────────────────────────────────────────────────────────

  return (
    <div className='min-h-screen flex flex-col'>
      {/* Banner */}
      <header className='border-b bg-card'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex flex-col items-center text-center gap-1'>
            <div className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-primary' />
              <span className='font-semibold text-xl tracking-tight'>
                Emaily = Email + Beautify + AI
              </span>
            </div>
            <p className='text-sm text-muted-foreground max-w-md'>
              Transform your casual messages into professional, polished emails
              with AI-powered translation and formatting.
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className='flex-1 container mx-auto px-4 py-6'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left: Forms */}
          <div className='lg:col-span-2 space-y-4'>
            {/* Card 1: Password Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Lock className='h-4 w-4' />
                  Password Authentication
                </CardTitle>
                <CardDescription>
                  Enter your password to identify your sender email.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <form
                  id='frm-password'
                  onSubmit={passwordForm.handleSubmit(onPwdSubmit)}
                >
                  <FieldGroup>
                    <Controller
                      name='password'
                      control={passwordForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor='frm-pwd-title'>
                            Password
                          </FieldLabel>
                          <div className='flex gap-2'>
                            <div className='relative flex-1'>
                              <div>
                                <Input
                                  {...field}
                                  id='frm-pwd-title'
                                  aria-invalid={fieldState.invalid}
                                  autoComplete='off'
                                  type={showPassword ? "text" : "password"}
                                  placeholder='Enter password...'
                                  disabled={isUnlocked}
                                  className='pr-10'
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (
                                      passwordForm.formState.errors.password
                                    ) {
                                      passwordForm.clearErrors("password");
                                    }
                                  }}
                                />
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </div>
                              <Button
                                type='button'
                                onClick={() => setShowPassword((v) => !v)}
                                disabled={isUnlocked}
                                className='absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground disabled:opacity-40 bg-transparent hover:bg-transparent'
                                aria-label={
                                  showPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {showPassword ? (
                                  <EyeOff className='h-4 w-4' />
                                ) : (
                                  <Eye className='h-4 w-4' />
                                )}
                              </Button>
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
                                  Verified
                                </>
                              ) : passwordForm.formState.isSubmitting ||
                                passwordForm.formState.isLoading ? (
                                "Verifying..."
                              ) : (
                                <>
                                  <Lock className='h-4 w-4' />
                                  Verify
                                </>
                              )}
                            </Button>
                          </div>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </form>
                {isUnlocked && account && (
                  <div className='flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm'>
                    <span className='text-muted-foreground'>Sender Email</span>
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
            </Card>

            {/* Card 2: Compose Email */}
            <Card>
              <CardHeader>
                <CardTitle className='text-xl tracking-tight'>
                  Compose Email
                </CardTitle>
                <CardDescription>
                  {isUnlocked
                    ? "Fill in the information below to send an email to the recipient."
                    : "Verify your password above to start composing."}
                </CardDescription>
              </CardHeader>
              {/* <Form {...emailForm}> */}
              <form
                id='frm-email'
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              >
                <CardContent className='space-y-4'>
                  <FieldGroup>
                    <Controller
                      control={emailForm.control}
                      name='receiverEmail'
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor='frm-email-title'>
                            Recipient Email
                          </FieldLabel>
                          <Input
                            {...field}
                            id='frm-email-title'
                            aria-invalid={fieldState.invalid}
                            type='email'
                            placeholder='recipient@domain.com'
                            disabled={!isUnlocked}
                            autoComplete='email'
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      control={emailForm.control}
                      name='language'
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor='frm-language-title'>
                            Target Language
                          </FieldLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!isUnlocked}
                          >
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Select language...' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {LANGUAGES.map((lang) => (
                                  <SelectItem
                                    key={lang.value}
                                    value={lang.value}
                                  >
                                    {lang.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      control={emailForm.control}
                      name='subject'
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor='frm-subject-title'>
                            Email Subject
                          </FieldLabel>
                          <Input
                            {...field}
                            id='frm-subject-title'
                            aria-invalid={fieldState.invalid}
                            type='text'
                            placeholder='Enter email subject...'
                            disabled={!isUnlocked}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      control={emailForm.control}
                      name='content'
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor='frm-content-title'>
                            Email Content
                          </FieldLabel>
                          <Textarea
                            {...field}
                            id='frm-content-title'
                            aria-invalid={fieldState.invalid}
                            placeholder='Enter your email content here...'
                            rows={10}
                            disabled={!isUnlocked}
                            className='resize-y'
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                          <div className='flex justify-between items-center'>
                            <span className='text-xs text-muted-foreground ml-auto'>
                              {watchedContent.length}/5000
                            </span>
                          </div>
                        </Field>
                      )}
                    />
                  </FieldGroup>

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
                    Clear All
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
                      ? "Processing..."
                      : account?.type === "premium"
                        ? "Preview"
                        : "Send Email"}
                  </Button>
                </CardFooter>
              </form>
              {/* </Form> */}
            </Card>

            {/* Card 3: Preview — Premium only, displayed below form */}
            {preview && (
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-base tracking-tight'>
                      Email Preview
                    </CardTitle>
                    <Badge variant='secondary'>Premium</Badge>
                  </div>
                  <CardDescription>
                    Review the content before sending.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3 rounded-lg border bg-muted/50 mx-6 p-4 text-sm'>
                  <InfoRow label='Recipient' value={preview.receiverEmail} />
                  <InfoRow label='Subject' value={preview.subject} />
                  <InfoRow
                    label='Language'
                    value={
                      LANGUAGES.find((l) => l.value === preview.targetlanguage)
                        ?.label ?? preview.targetlanguage
                    }
                  />
                  <div className='flex flex-col gap-1'>
                    <span className='text-muted-foreground'>
                      Processed Content
                    </span>
                    <p className='text-foreground whitespace-pre-wrap break-words'>
                      {preview.content}
                    </p>
                  </div>
                </CardContent>
                {apiError && (
                  <p className='px-6 pt-2 text-sm text-destructive'>
                    {apiError}
                  </p>
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
                      ? "Sending..."
                      : "Confirm Send"}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Right: Usage Guide */}
          <div className='hidden lg:block'>
            <UsageGuide />
          </div>
        </div>

        {/* Footer Credit */}
        <footer className='border-t border-border bg-muted/40 mt-12 py-6'>
          <div className='container mx-auto px-4'>
            <div className='flex flex-col items-center gap-3 text-sm text-muted-foreground'>
              <Image
                src='/logo-team.png'
                alt='+84 Team logo'
                width={48}
                height={48}
                className='rounded-full object-contain'
              />
              <p>Presented by +84 Team, Flinders University</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
