import React, { useState, useEffect } from 'react';
import { Menu, Lock, ShieldCheck, Cpu, Server } from 'lucide-react';
import { ActiveView } from './Sidebar';
import { checkBackendHealth } from '../services/apiService';

interface TopHeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenMobile: () => void;
}

const VIEW_TITLES: Record<ActiveView, { title: string; subtitle: string }> = {
  overview: { title: 'Overview', subtitle: 'System status & cryptographic controls' },
  hide: { title: 'Hide Message', subtitle: 'Embed encrypted payload into image' },
  extract: { title: 'Extract Message', subtitle: 'Recover and decrypt hidden payload' },
  inspector: { title: 'Bit Inspector', subtitle: 'Analyze RGB channel bit planes' },
  verification: { title: 'System Verification', subtitle: 'Automated cryptographic test suite' },
  'how-it-works': { title: 'How It Works', subtitle: 'LSB steganography & AES-GCM workflow' },
  media: { title: 'Media Walkthrough', subtitle: 'Interactive video, audio narration & bit-plane decomposer' },
  about: { title: 'System Specifications', subtitle: 'Cryptographic architecture & SPXL binary protocol' },
  operator: { title: 'Operator Authorization', subtitle: 'Register operator identity and security clearance' },
  settings: { title: 'Settings', subtitle: 'Engine configuration and local cache' }
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeView,
  onSelectView,
  onOpenMobile
}) => {
  const current = VIEW_TITLES[activeView] || VIEW_TITLES.overview;
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkBackendHealth().then((res) => setServerOnline(res.isOnline));
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left: Mobile Toggle & View Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {current.title}
            </h1>
            <span className="hidden sm:inline-block text-xs font-mono text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
              v1.0
            </span>
          </div>
          <p className="hidden sm:block text-xs text-slate-500">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Security badge: Client-side processing + optional backend health */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-700 bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-slate-200/90 font-medium shadow-2xs">
          <span
            className={`h-2 w-2 rounded-full ${
              serverOnline ? 'bg-emerald-500 shadow-[0_0_6px_#10B981]' : 'bg-sky-500 shadow-[0_0_6px_#0EA5E9]'
            } animate-pulse`}
          ></span>
          <span className="flex items-center gap-1.5">
            {serverOnline ? (
              <>
                <Server className="h-3.5 w-3.5 text-emerald-600" />
                <span>Backend API: Online</span>
              </>
            ) : (
              <>
                <Cpu className="h-3.5 w-3.5 text-violet-600" />
                <span>Local Enclave (Offline Ready)</span>
              </>
            )}
          </span>
        </div>

        {/* Action Button: Quick Navigate */}
        {activeView !== 'hide' ? (
          <button
            onClick={() => onSelectView('hide')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white shadow-sm shadow-violet-500/25 transition-all cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>New Message</span>
          </button>
        ) : (
          <button
            onClick={() => onSelectView('extract')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-1.5 sm:py-2 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
            <span>Extract Mode</span>
          </button>
        )}
      </div>
    </header>
  );
};
