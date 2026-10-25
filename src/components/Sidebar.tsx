import React from 'react';
import {
  LayoutGrid,
  Lock,
  Unlock,
  Sliders,
  ShieldCheck,
  HelpCircle,
  Settings,
  Shield,
  Layers,
  CheckCircle2,
  Video,
  Cpu,
  UserCheck
} from 'lucide-react';

export type ActiveView =
  | 'overview'
  | 'hide'
  | 'extract'
  | 'inspector'
  | 'verification'
  | 'how-it-works'
  | 'media'
  | 'about'
  | 'operator'
  | 'settings';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  mobileOpen,
  onCloseMobile
}) => {
  const menuItems = [
    {
      id: 'overview' as ActiveView,
      label: 'Overview',
      icon: LayoutGrid
    },
    {
      id: 'hide' as ActiveView,
      label: 'Hide Message',
      icon: Lock
    },
    {
      id: 'extract' as ActiveView,
      label: 'Extract Message',
      icon: Unlock
    },
    {
      id: 'inspector' as ActiveView,
      label: 'Bit Inspector',
      icon: Sliders
    },
    {
      id: 'verification' as ActiveView,
      label: 'Verification',
      icon: ShieldCheck
    },
    {
      id: 'how-it-works' as ActiveView,
      label: 'How It Works',
      icon: Layers
    },
    {
      id: 'media' as ActiveView,
      label: 'Media Walkthrough',
      icon: Video
    },
    {
      id: 'about' as ActiveView,
      label: 'System Specs',
      icon: Cpu
    },
    {
      id: 'operator' as ActiveView,
      label: 'Operator Clearance',
      icon: UserCheck
    },
    {
      id: 'settings' as ActiveView,
      label: 'Settings',
      icon: Settings
    }
  ];

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col justify-between bg-white border-r border-slate-200/80 text-slate-700 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5">
          {/* Professional Brand Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-[1.5px] shadow-md shadow-violet-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white">
                {/* Shield + Pixel Glyph */}
                <div className="relative flex items-center justify-center">
                  <Shield className="h-5 w-5 text-violet-600" />
                  <div className="absolute h-1.5 w-1.5 rounded-[1px] bg-rose-500"></div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-baseline">
                <span className="text-base font-bold tracking-tight text-slate-900">Secret</span>
                <span className="text-base font-bold tracking-tight text-violet-600">Pixel</span>
              </div>
              <div className="text-[11px] font-medium text-slate-400">
                Secure Image Steganography
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#7C3AED] text-white font-semibold shadow-md shadow-violet-500/25'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Security Enclave Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Client Enclave Active</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-snug">
              AES-GCM 256-bit encryption with zero server telemetry.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
