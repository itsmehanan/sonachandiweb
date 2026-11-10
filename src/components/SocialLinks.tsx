import React from 'react';
import { Mail } from 'lucide-react';

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'snapchat' | 'x';

export interface SocialHandles {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  snapchat?: string;
  x?: string;
}

/**
 * Normalises input (handle or URL) to a canonical https profile URL per platform.
 * Rejects javascript:, data:, unknown domains, etc.
 */
export function normalizeSocialUrl(platform: SocialPlatform, raw: string): { url: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { url: '' };

  // Block harmful protocols immediately
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return { url: '', error: 'Unsafe URL protocol is not permitted.' };
  }

  // Handle clean alphanumeric username / handle (with optional leading @)
  const isPureHandle = /^@?[a-zA-Z0-9._-]+$/.test(trimmed);
  const cleanHandle = trimmed.replace(/^@/, '');

  if (isPureHandle) {
    switch (platform) {
      case 'instagram':
        return { url: `https://www.instagram.com/${cleanHandle}` };
      case 'facebook':
        return { url: `https://www.facebook.com/${cleanHandle}` };
      case 'tiktok':
        return { url: `https://www.tiktok.com/@${cleanHandle}` };
      case 'youtube':
        return { url: `https://www.youtube.com/@${cleanHandle}` };
      case 'snapchat':
        return { url: `https://www.snapchat.com/add/${cleanHandle}` };
      case 'x':
        return { url: `https://x.com/${cleanHandle}` };
    }
  }

  // Try parsing as full URL
  let parsed: URL;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(withProtocol);
  } catch {
    return { url: '', error: `Invalid ${platform} handle or URL.` };
  }

  // Always force https
  parsed.protocol = 'https:';

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

  switch (platform) {
    case 'instagram':
      if (hostname !== 'instagram.com') {
        return { url: '', error: 'URL must belong to instagram.com' };
      }
      return { url: parsed.toString() };

    case 'facebook':
      if (hostname !== 'facebook.com' && hostname !== 'fb.com') {
        return { url: '', error: 'URL must belong to facebook.com' };
      }
      return { url: parsed.toString() };

    case 'tiktok':
      if (hostname !== 'tiktok.com') {
        return { url: '', error: 'URL must belong to tiktok.com' };
      }
      return { url: parsed.toString() };

    case 'youtube':
      if (hostname !== 'youtube.com' && hostname !== 'youtu.be') {
        return { url: '', error: 'URL must belong to youtube.com' };
      }
      return { url: parsed.toString() };

    case 'snapchat':
      if (hostname !== 'snapchat.com') {
        return { url: '', error: 'URL must belong to snapchat.com' };
      }
      return { url: parsed.toString() };

    case 'x':
      if (hostname !== 'x.com' && hostname !== 'twitter.com') {
        return { url: '', error: 'URL must belong to x.com or twitter.com' };
      }
      return { url: parsed.toString() };
  }
}

/**
 * Normalises WhatsApp number: digits only with country code.
 * Strips +, spaces, leading 0, converts 03xx to 923xx, ensures 10-15 digits.
 */
export function normalizeWhatsAppNumber(raw: string): {
  normalized: string;
  waUrl: string;
  error?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { normalized: '', waUrl: '' };

  let digits = trimmed.replace(/\D/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Convert Pakistani domestic format 03xx to 923xx
  if (digits.startsWith('03')) {
    digits = '92' + digits.slice(1);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  } else if (digits.startsWith('3') && digits.length === 10) {
    digits = '92' + digits;
  }

  if (digits.length < 10 || digits.length > 15) {
    return {
      normalized: digits,
      waUrl: `https://wa.me/${digits}`,
      error: 'WhatsApp number must contain 10 to 15 digits including country code (e.g., 923109412332).',
    };
  }

  return {
    normalized: digits,
    waUrl: `https://wa.me/${digits}`,
  };
}

/**
 * Validates email format.
 */
export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* =========================================================================
   Inline SVG Brand Icons (no external icon package)
   ========================================================================= */

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68a6.34 6.34 0 0 0 6.33 6.32 6.34 6.34 0 0 0 6.34-6.32V9.08a8.16 8.16 0 0 0 3.92.92V6.69z" />
  </svg>
);

export const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const SnapchatIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.004 2c-3.567 0-6.196 2.687-6.264 6.43-.024 1.345.395 2.502.793 3.297.108.216.035.474-.162.613-.538.38-1.572 1.002-1.996 1.488-.344.394-.378.892-.093 1.306.402.585 1.48.972 2.457 1.258.156.046.257.195.235.355-.067.48-.28 1.455-.783 1.838-.34.258-.804.38-1.38.362-.314-.01-.587.218-.62.53-.04.37.153.693.475.83 1.157.492 2.766.452 3.874-.15.228-.124.507-.097.712.064 1.12.88 2.378 1.196 2.756 1.196.38 0 1.637-.315 2.756-1.196.205-.16.484-.188.712-.064 1.108.602 2.717.642 3.874.15.322-.137.515-.46.475-.83-.033-.312-.306-.54-.62-.53-.576.018-1.04-.104-1.38-.362-.503-.383-.716-1.358-.783-1.838-.022-.16.079-.309.235-.355.977-.286 2.055-.673 2.457-1.258.285-.414.251-.912-.093-1.306-.424-.486-1.458-1.108-1.996-1.488-.197-.139-.27-.397-.162-.613.398-.795.817-1.952.793-3.297C18.2 4.687 15.57 2 12.004 2z" />
  </svg>
);

export const XIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/* =========================================================================
   SocialLinks Component
   Renders round brand icons for active platforms.
   Optionally includes an "Email us" mailto link.
   ========================================================================= */

export interface SocialLinksProps {
  socialHandles?: SocialHandles;
  contactEmail?: string;
  variant?: 'light' | 'dark' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  showEmail?: boolean;
  className?: string;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({
  socialHandles,
  contactEmail,
  variant = 'gold',
  size = 'md',
  showEmail = false,
  className = '',
}) => {
  if (!socialHandles && !contactEmail) return null;

  const platforms: Array<{
    key: SocialPlatform;
    name: string;
    url?: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'instagram',
      name: 'Instagram',
      url: socialHandles?.instagram,
      icon: <InstagramIcon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
    },
    {
      key: 'facebook',
      name: 'Facebook',
      url: socialHandles?.facebook,
      icon: <FacebookIcon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
    },
    {
      key: 'tiktok',
      name: 'TikTok',
      url: socialHandles?.tiktok,
      icon: <TikTokIcon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
    },
    {
      key: 'youtube',
      name: 'YouTube',
      url: socialHandles?.youtube,
      icon: <YouTubeIcon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
    },
    {
      key: 'snapchat',
      name: 'Snapchat',
      url: socialHandles?.snapchat,
      icon: <SnapchatIcon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
    },
    {
      key: 'x',
      name: 'X (Twitter)',
      url: socialHandles?.x,
      icon: <XIcon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />,
    },
  ];

  const activePlatforms = platforms.filter((p) => Boolean(p.url && p.url.trim()));
  const hasEmail = Boolean(showEmail && contactEmail && contactEmail.trim());

  if (activePlatforms.length === 0 && !hasEmail) return null;

  // Round button sizes
  const btnSizeClass =
    size === 'sm'
      ? 'w-7 h-7'
      : size === 'lg'
      ? 'w-11 h-11'
      : 'w-9 h-9';

  // Theming classes
  let iconBtnClass = '';
  if (variant === 'dark') {
    iconBtnClass =
      'rounded-full bg-[#1F1914] text-[#C9A54B] hover:text-white hover:bg-[#B8923A] border border-[#C9A54B]/30 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105 active:scale-95';
  } else if (variant === 'light') {
    iconBtnClass =
      'rounded-full bg-white text-[#7A5A12] hover:text-white hover:bg-[#B8923A] border border-[#E2D8C9] hover:border-[#B8923A] flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105 active:scale-95';
  } else {
    iconBtnClass =
      'rounded-full bg-[#FAF7F2] text-[#8E6E24] hover:text-white hover:bg-[#B8923A] border border-[#B8923A]/30 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105 active:scale-95';
  }

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {activePlatforms.map((p) => {
        const norm = normalizeSocialUrl(p.key, p.url || '');
        const href = norm.url || p.url;
        return (
          <a
            key={p.key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow Sona Chandi Gold Collection on ${p.name}`}
            className={`${btnSizeClass} ${iconBtnClass}`}
            title={`Follow on ${p.name}`}
          >
            {p.icon}
          </a>
        );
      })}

      {hasEmail && (
        <a
          href={`mailto:${contactEmail?.trim()}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-2xs ${
            variant === 'dark'
              ? 'bg-[#1F1914] text-[#F1D98B] hover:text-white hover:bg-[#B8923A] border border-[#C9A54B]/30'
              : 'bg-white text-[#7A5A12] hover:text-[#1A1410] border border-[#E2D8C9] hover:border-[#B8923A]'
          }`}
          title={`Email us at ${contactEmail}`}
        >
          <Mail className="w-3.5 h-3.5 text-[#B8923A]" />
          <span>Email us</span>
        </a>
      )}
    </div>
  );
};
