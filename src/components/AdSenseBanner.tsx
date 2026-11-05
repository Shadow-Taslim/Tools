import React, { useEffect, useRef, useState } from 'react';

// Declare global adsbygoogle array on window
declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export interface AdSenseBannerProps {
  /**
   * AdSense ad unit slot ID (e.g. "1234567890")
   */
  adSlot?: string;
  /**
   * Ad layout format (default: 'auto')
   */
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  /**
   * Whether the ad is full-width responsive (default: true)
   */
  fullWidthResponsive?: boolean;
  /**
   * Custom container CSS classes for layout and spacing
   */
  className?: string;
  /**
   * Optional in-article or in-feed layout key
   */
  layoutKey?: string;
  /**
   * Flag to suppress rendering (e.g. on private, quarantine, or checkout screens)
   */
  suppress?: boolean;
}

export default function AdSenseBanner({
  adSlot = '1234567890',
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  layoutKey,
  suppress = false
}: AdSenseBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const isPushedRef = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Retrieve configurable publisher client ID
  const clientId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADSENSE_CLIENT_ID) 
    ? String(import.meta.env.VITE_ADSENSE_CLIENT_ID).trim() 
    : 'ca-pub-1234567890123456';

  const isPlaceholderClient = !clientId || clientId.includes('1234567890') || clientId.includes('XXXX');
  const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

  useEffect(() => {
    if (suppress) return;
    if (isPlaceholderClient || isDevelopment) {
      // In development or when using placeholder ID, skip live script push to avoid AdSense 400 errors
      return;
    }

    if (adRef.current && !isPushedRef.current) {
      // Check if adsbygoogle already processed this element
      const alreadyFilled = adRef.current.getAttribute('data-adsbygoogle-status');
      if (!alreadyFilled) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isPushedRef.current = true;
          setAdLoaded(true);
        } catch (err) {
          // Handle ad blocker or initialization collision gracefully without throwing unhandled exceptions
          console.warn('AdSense initialization notice:', err);
          setAdError(true);
        }
      }
    }
  }, [suppress, isPlaceholderClient, isDevelopment, adSlot]);

  // Privacy Shield: Never render on suppressed/private paths
  if (suppress) {
    return null;
  }

  // Determine reserved minimum height based on adFormat to guarantee Zero Cumulative Layout Shift (CLS)
  const getReservedHeightClass = () => {
    switch (adFormat) {
      case 'rectangle':
        return 'min-h-[250px] max-w-[300px] sm:max-w-[336px] min-w-[280px]';
      case 'horizontal':
        return 'min-h-[90px] sm:min-h-[100px] w-full max-w-5xl';
      case 'vertical':
        return 'min-h-[600px] w-[160px] sm:w-[300px]';
      case 'fluid':
        return 'min-h-[120px] w-full max-w-4xl';
      case 'auto':
      default:
        return 'min-h-[100px] sm:min-h-[120px] md:min-h-[140px] w-full max-w-5xl';
    }
  };

  return (
    <div
      className={`mx-auto w-full my-6 flex flex-col items-center justify-center transition-all ${className}`}
      role="region"
      aria-label="Advertisement Banner"
    >
      {/* Micro-label compliant with AdSense disclosure policies */}
      <div className="w-full max-w-5xl flex items-center justify-between pb-1.5 px-2">
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 select-none">
          Advertisement
        </span>
        <span className="text-[9px] font-mono text-slate-600 select-none hidden sm:inline-block">
          Sponsors QuickNest Free Privacy Tools
        </span>
      </div>

      {/* Reserved container: maintains exact spatial boundary to protect Core Web Vitals LCP/CLS */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 shadow-sm ${getReservedHeightClass()}`}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '120px' }}
      >
        {/* Development Placeholder State (When live ca-pub ID is pending or in local dev) */}
        {(isPlaceholderClient || isDevelopment || adError) ? (
          <div className="w-full h-full min-h-[90px] rounded-xl border border-dashed border-slate-800/90 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                AD
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-300">
                  Google AdSense Display Unit
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Slot: {adSlot} · Format: {adFormat} · Client: {clientId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/50">
                CLS Protected
              </span>
              <span className="text-[11px] text-slate-500 hidden md:inline">
                {isDevelopment ? 'Preview Mode Active' : 'Pending Live Publisher Key'}
              </span>
            </div>
          </div>
        ) : (
          /* Live Google AdSense Ins Element */
          <ins
            ref={adRef}
            className="adsbygoogle block w-full text-center"
            style={{ display: 'block', minHeight: '90px' }}
            data-ad-client={clientId}
            data-ad-slot={adSlot}
            data-ad-format={adFormat}
            data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
            data-ad-layout-key={layoutKey}
          />
        )}
      </div>
    </div>
  );
}
