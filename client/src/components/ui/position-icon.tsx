import * as React from 'react';
import { cn } from '@/lib/utils';

interface PositionIconProps {
  position: string;
  className?: string;
}

export function PositionIcon({ position, className }: PositionIconProps) {
  const iconColor = "text-yellow-500"; // Match the branding color

  switch (position) {
    case 'Batsman':
      // Cricket bat icon
      return (
        <div className={cn(iconColor, className)}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M18.5 2C17.12 2 16 3.12 16 4.5C16 5.88 17.12 7 18.5 7S21 5.88 21 4.5C21 3.12 19.88 2 18.5 2M15.07 4.93L3 17L5 19L17.07 6.93C16.65 6.18 16.35 5.36 16.17 4.5L15.07 4.93M12 15L9 18L11 20L14 17L12 15Z"/>
          </svg>
        </div>
      );
    
    case 'Bowler':
      // Cricket ball icon
      return (
        <div className={cn(iconColor, className)}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.8"/>
            <path d="M12 4C7.58 4 4 7.58 4 12S7.58 20 12 20 20 16.42 20 12 16.42 4 12 4M12 6C15.31 6 18 8.69 18 12S15.31 18 12 18 6 15.31 6 12 8.69 6 12 6M8 12C8 10.34 9.34 9 11 9C11.55 9 12 8.55 12 8S11.55 7 11 7C8.24 7 6 9.24 6 12S8.24 17 11 17C11.55 17 12 16.55 12 16S11.55 15 11 15C9.34 15 8 13.66 8 12M16 12C16 13.66 14.66 15 13 15C12.45 15 12 15.45 12 16S12.45 17 13 17C15.76 17 18 14.76 18 12S15.76 7 13 7C12.45 7 12 7.45 12 8S12.45 9 13 9C14.66 9 16 10.34 16 12Z"/>
          </svg>
        </div>
      );
    
    case 'Wicket-keeper':
      // Wicket keeper gloves icon
      return (
        <div className={cn(iconColor, className)}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M6 2C4.9 2 4 2.9 4 4V10C4 11.1 4.9 12 6 12H8V10H6V4H8V2H6M16 2V4H18V10H16V12H18C19.1 12 20 11.1 20 10V4C20 2.9 19.1 2 18 2H16M8 6V18C8 19.1 8.9 20 10 20H14C15.1 20 16 19.1 16 18V6H8M10 8H14V18H10V8Z"/>
          </svg>
        </div>
      );
    
    case 'All-rounder':
      // Cricket bat crossing over stumps
      return (
        <div className={cn(iconColor, className)}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            {/* Stumps */}
            <rect x="9" y="14" width="1.5" height="8" fill="currentColor"/>
            <rect x="11.25" y="14" width="1.5" height="8" fill="currentColor"/>
            <rect x="13.5" y="14" width="1.5" height="8" fill="currentColor"/>
            {/* Bails */}
            <rect x="8.5" y="13.5" width="7" height="0.8" fill="currentColor"/>
            {/* Bat crossing over */}
            <path d="M3 6L6 9L18 21L21 18L9 6L6 3L3 6M15 9L18 6L21 9L18 12L15 9Z" fill="currentColor" opacity="0.8"/>
          </svg>
        </div>
      );
    
    default:
      // Default cricket icon
      return (
        <div className={cn(iconColor, className)}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <circle cx="12" cy="12" r="8" fill="currentColor"/>
          </svg>
        </div>
      );
  }
}
