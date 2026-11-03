import React from 'react';

export interface WhatsAppButtonProps {
  href?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  ariaLabel?: string;
  target?: string;
  rel?: string;
  children?: React.ReactNode;
}

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} shrink-0`}
    aria-hidden="true"
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.66 20.16 9.3 19.8 8.1 19.09L7.81 18.92L4.69 19.74L5.52 16.7L5.33 16.39C4.54 15.13 4.12 13.54 4.12 11.91C4.12 7.37 7.82 3.67 12.04 3.67ZM8.83 7.37C8.61 7.37 8.41 7.38 8.24 7.42C8.03 7.47 7.74 7.6 7.55 7.81C7.3 8.08 6.64 8.7 6.64 9.96C6.64 11.22 7.56 12.43 7.69 12.6C7.82 12.77 9.47 15.32 12.04 16.43C14.18 17.35 14.62 17.17 15.08 17.13C15.54 17.09 16.57 16.52 16.78 15.93C17 15.34 17 14.84 16.93 14.73C16.86 14.62 16.69 14.56 16.43 14.43C16.17 14.3 14.9 13.67 14.66 13.58C14.43 13.5 14.26 13.45 14.09 13.71C13.92 13.96 13.43 14.56 13.28 14.73C13.13 14.9 12.98 14.92 12.72 14.79C12.46 14.66 11.62 14.39 10.63 13.5C9.86 12.81 9.34 11.96 9.19 11.7C9.04 11.45 9.17 11.31 9.3 11.18C9.42 11.06 9.56 10.88 9.7 10.72C9.83 10.55 9.87 10.43 9.96 10.26C10.05 10.09 10 9.94 9.94 9.81C9.87 9.68 9.39 8.49 9.19 8C9 7.52 8.81 7.59 8.66 7.58L8.83 7.37Z" />
  </svg>
);

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  href,
  label,
  size = 'md',
  fullWidth = false,
  className = '',
  onClick,
  ariaLabel,
  target = '_blank',
  rel = 'noopener noreferrer',
  children,
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-2 text-xs min-h-[40px] sm:min-h-[44px]',
    md: 'px-5 py-3 text-xs sm:text-sm min-h-[44px]',
    lg: 'px-7 py-3.5 text-sm sm:text-base min-h-[48px]',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
  };

  const baseStyles =
    'wa-btn-pulse inline-flex items-center justify-center gap-2.5 font-semibold tracking-wide text-white bg-[#25D366] hover:bg-[#1EBE5A] rounded-xl transition-all duration-200 shadow-md shadow-[#25D366]/30 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 outline-hidden cursor-pointer select-none';

  const widthStyle = fullWidth ? 'w-full' : '';
  const combinedClasses = `${baseStyles} ${sizeClasses[size]} ${widthStyle} ${className}`.trim();

  const content = (
    <>
      <WhatsAppIcon className={iconSizes[size]} />
      {children || <span>{label || 'Chat on WhatsApp'}</span>}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        className={combinedClasses}
        aria-label={ariaLabel || label || 'Chat on WhatsApp'}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={combinedClasses}
      aria-label={ariaLabel || label || 'Chat on WhatsApp'}
    >
      {content}
    </button>
  );
};
