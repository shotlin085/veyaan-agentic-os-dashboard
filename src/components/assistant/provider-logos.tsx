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

const QwenLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="10" fill="#6C3FF4" />
    <path
      fill="#fff"
      d="M12 5.2 17.8 8.6v6.8L12 18.8 6.2 15.4V8.6L12 5.2Zm0 2.3-3.9 2.28v4.44L12 16.5l3.9-2.28V9.78L12 7.5Z"
    />
    <circle cx="12" cy="12" r="2.1" fill="#fff" />
  </svg>
);

const MoonshotLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="10" fill="#16172B" />
    <path
      fill="#fff"
      d="M14.8 5.6a7 7 0 1 0 0 12.8 8.4 8.4 0 0 1 0-12.8Z"
    />
  </svg>
);

const MiniMaxLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="10" fill="#FF4D4F" />
    <path
      fill="#fff"
      d="M6 17V7h2.1l2.9 4.8L13.9 7H16v10h-2.2v-6.4L11 15.3 8.2 10.6V17H6Z"
    />
  </svg>
);

const ZAiLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="#155EEF" />
    <path fill="#fff" d="M7.5 8h9l-6 8h6v1.5h-9l6-8h-6V8Z" />
  </svg>
);

const XiaomiLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="#FF6900" />
    <path fill="#fff" d="M6.8 7h2.9l2.3 6.2L14.3 7h2.9l-3.6 10h-2.3L6.8 7Z" />
  </svg>
);

const TencentLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="10" fill="#0052D9" />
    <path
      fill="#fff"
      d="M12 5.5c2.5 0 4.4 1.7 4.4 4.1 0 1.9-1.2 3-2.2 3.7 1.6.4 3.4 1.4 3.4 3.1 0 1.9-2.3 2.9-5.6 2.9s-5.6-1-5.6-2.9c0-1.7 1.8-2.7 3.4-3.1-1-.7-2.2-1.8-2.2-3.7 0-2.4 1.9-4.1 4.4-4.1Zm0 1.6c-1.4 0-2.4 1-2.4 2.4S10.6 12 12 12s2.4-1 2.4-2.5-1-2.4-2.4-2.4Zm0 7.2c-2.1 0-3.6.7-3.6 1.5s1.5 1.5 3.6 1.5 3.6-.7 3.6-1.5-1.5-1.5-3.6-1.5Z"
    />
  </svg>
);

const StepFunLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="#0F1115" />
    <path fill="#fff" d="M5 17h4v-3h4V9h4V6h2v5h-4v5H9v3H5v-2Z" />
  </svg>
);

const NvidiaLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="10" fill="#000" />
    <path
      fill="#76B900"
      d="M6.3 10.2c1.6-1.5 3.7-2.4 5.9-2.4 3.9 0 7.2 2.6 8.3 6.1-1.1-1.5-3-2.5-5.1-2.5-.5 0-1 .05-1.4.15v-1.6c.4-.03.8-.05 1.2-.05 2.2 0 4.1.9 5.3 2.4-1.4-3.9-5.1-6.7-9.4-6.7-2 0-3.8.6-5.4 1.7l.6.9Zm5.9 1.1c-1.9 0-3.6.7-4.9 1.9l1 1.1c1-1 2.4-1.6 3.9-1.6 2.2 0 4.1 1.4 4.8 3.3-1.5-.9-3.3-.9-4.8-.1v-1.6c.4-.1.9-.15 1.3-.15 1.1 0 2.1.4 2.8 1.1-.9-2.3-3.1-3.9-5.7-3.9h.6Z"
    />
  </svg>
);

const SakanaLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="10" fill="#E8536A" />
    <path
      fill="#fff"
      d="M17 12c-1.6-2.4-4-3.8-6.4-3.8-2.6 0-4.9 1.6-5.9 3.8 1 2.2 3.3 3.8 5.9 3.8 2.4 0 4.8-1.4 6.4-3.8Zm0 0 2.3-1.6-.6 1.6.6 1.6L17 12Z"
    />
    <circle cx="8.6" cy="11.3" r=".8" fill="#E8536A" />
  </svg>
);

const PoolsideLogo: FC<LogoProps> = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="10" fill="#00A3A3" />
    <path
      d="M4.5 9.5c1.2 1 2 1 3.2 0s2-1 3.2 0 2 1 3.2 0 2-1 3.2 0 2 1 3.2 0"
      stroke="#fff"
      strokeWidth="1.4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M4.5 13.5c1.2 1 2 1 3.2 0s2-1 3.2 0 2 1 3.2 0 2-1 3.2 0 2 1 3.2 0"
      stroke="#fff"
      strokeWidth="1.4"
      strokeLinecap="round"
      fill="none"
      opacity=".6"
    />
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
 * provider in a small UI icon slot, same as any IDE's model picker. Every
 * provider currently in the real 34-model catalog (GET .../hermes/model-
 * options) has a mark now; a generic chip icon is still the fallback for
 * anything the catalog adds later that isn't covered here yet, rather
 * than guessing at an unfamiliar brand's mark.
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
    case "Qwen":
      return <QwenLogo className={size} />;
    case "Moonshot AI":
      return <MoonshotLogo className={size} />;
    case "MiniMax":
      return <MiniMaxLogo className={size} />;
    case "Z.AI":
      return <ZAiLogo className={size} />;
    case "Xiaomi":
      return <XiaomiLogo className={size} />;
    case "Tencent":
      return <TencentLogo className={size} />;
    case "StepFun":
      return <StepFunLogo className={size} />;
    case "NVIDIA":
      return <NvidiaLogo className={size} />;
    case "Sakana AI":
      return <SakanaLogo className={size} />;
    case "Poolside":
      return <PoolsideLogo className={size} />;
    default:
      return <CpuIcon className={`${size} text-foreground/40`} />;
  }
};
