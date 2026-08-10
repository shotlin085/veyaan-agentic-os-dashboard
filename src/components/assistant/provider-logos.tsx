import type { FC, SVGProps } from "react";
import { CpuIcon } from "lucide-react";

type LogoProps = SVGProps<SVGSVGElement>;

const OpenAILogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A5.98 5.98 0 0 0 10.72.5a6.05 6.05 0 0 0-5.77 4.2 5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .75 7.09 5.98 5.98 0 0 0 .52 4.9 6.05 6.05 0 0 0 6.51 2.91 5.98 5.98 0 0 0 4.53 2.02 6.05 6.05 0 0 0 5.78-4.21 5.98 5.98 0 0 0 4-2.9 6.05 6.05 0 0 0-.76-7.09Zm-9.03 12.62a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.78.78 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.06v5.58a4.51 4.51 0 0 1-4.5 4.49ZM3.5 18.02a4.47 4.47 0 0 1-.54-3.01l.14.09 4.78 2.76a.78.78 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.07l-4.83 2.79a4.51 4.51 0 0 1-6.14-1.66ZM2.26 7.9a4.48 4.48 0 0 1 2.35-1.97v5.67a.77.77 0 0 0 .39.67l5.83 3.37-2.02 1.17a.08.08 0 0 1-.07 0L3.9 14.03a4.51 4.51 0 0 1-1.65-6.14Zm16.6 3.86-5.84-3.38 2.02-1.16a.08.08 0 0 1 .07 0l4.83 2.79a4.5 4.5 0 0 1-.68 8.11v-5.67a.78.78 0 0 0-.4-.69Zm2.01-3.02-.14-.09-4.78-2.76a.78.78 0 0 0-.78 0l-5.84 3.37V6.94a.07.07 0 0 1 .03-.07l4.83-2.78a4.5 4.5 0 0 1 6.68 4.66ZM9.02 12.86l-2.02-1.17a.08.08 0 0 1-.04-.06V6.05a4.5 4.5 0 0 1 7.38-3.45l-.14.08-4.78 2.76a.78.78 0 0 0-.39.68l-.01 6.74Zm1.1-2.36 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3Z" />
  </svg>
);

const AnthropicLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M13.5 3h3.2l6.3 18h-3.4l-1.3-3.8h-6.5L10.5 21H7.1L13.5 3Zm.9 3.8-2.3 6.8h4.6l-2.3-6.8ZM7.3 3h3.3l-6.3 18H1L7.3 3Z" />
  </svg>
);

const GoogleLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38Z" />
  </svg>
);

const XAILogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M3 3h4.2l4.9 6.6L17.6 3H21l-7.2 9.3L21.3 21h-4.2l-5.2-7-6 7H2.7l7.6-9.6L3 3Z" />
  </svg>
);

const DeepSeekLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="10" fill="#4D6BFE" />
    <path fill="#fff" d="M7.5 9.2c0-1.77 1.66-3.2 3.9-3.2 1.7 0 3.13.83 3.7 2.1a.6.6 0 0 1-.32.8.62.62 0 0 1-.8-.3c-.4-.9-1.4-1.5-2.58-1.5-1.56 0-2.7.98-2.7 2.1 0 1.13 1.14 2 2.7 2 2.24 0 3.9 1.44 3.9 3.2 0 1.77-1.66 3.2-3.9 3.2-1.86 0-3.4-.98-3.86-2.4a.6.6 0 1 1 1.14-.38c.32.98 1.4 1.68 2.72 1.68 1.56 0 2.7-.97 2.7-2.1 0-1.12-1.14-2-2.7-2-2.24 0-3.9-1.43-3.9-3.2Z" />
  </svg>
);

export interface ProviderLogoProps {
  provider: string;
  className?: string;
}

/**
 * Small brand marks for the model picker (matches the reference ChatGPT-
 * style picker the user pointed at). Abstract/simplified renditions, not
 * traced official logo files - fine for identifying a real third-party
 * provider in a small UI icon slot, same as any IDE's model picker.
 * Providers without a known mark (the long tail of the 34-model catalog -
 * Qwen, Moonshot, MiniMax, Z.AI, etc.) fall back to a generic chip icon
 * rather than guessing at a logo.
 */
export const ProviderLogo: FC<ProviderLogoProps> = ({ provider, className }) => {
  const size = className ?? "size-3.5";
  switch (provider) {
    case "OpenAI":
      return <OpenAILogo className={size} />;
    case "Anthropic":
      return <AnthropicLogo className={size} />;
    case "Google":
      return <GoogleLogo className={size} />;
    case "xAI":
      return <XAILogo className={size} />;
    case "DeepSeek":
      return <DeepSeekLogo className={size} />;
    default:
      return <CpuIcon className={`${size} text-foreground/40`} />;
  }
};
