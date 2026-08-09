"use client";
import type { ComponentProps } from "react";
import {
  GoogleReCaptchaProvider as _GoogleReCaptchaProvider,
  GoogleReCaptchaProviderProps,
} from "@google-recaptcha/react";
import { JSX } from "react/jsx-runtime";
export type ReCaptchaProviderProps = ComponentProps<
  typeof _GoogleReCaptchaProvider
>;
export const GoogleReCaptchaProvider = (
  props: JSX.IntrinsicAttributes & GoogleReCaptchaProviderProps,
) => <_GoogleReCaptchaProvider {...props} />;
