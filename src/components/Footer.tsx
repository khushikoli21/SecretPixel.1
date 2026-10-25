import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  onOpenDeploymentGuide: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDeploymentGuide }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#080B14] py-12 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/60">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-sky-500 p-[1px]">
              <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#0D1220]">
                <Shield className="h-3.5 w-3.5 text-violet-400" />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-sm font-bold text-white">Secret</span>
              <span className="text-sm font-light text-sky-400">Pixel</span>
            </div>
            <span className="text-slate-600 ml-2">|</span>
            <span className="text-slate-400 text-[11px]">Enterprise Cryptographic Security</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6">
            <a href="#how-it-works" className="hover:text-slate-200 transition-colors">
              How It Works
            </a>
            <a href="#hide-workspace" className="hover:text-slate-200 transition-colors">
              Hide Message
            </a>
            <a href="#extract-workspace" className="hover:text-slate-200 transition-colors">
              Extract Message
            </a>
            <a href="#testing" className="hover:text-slate-200 transition-colors">
              Security Testing Table
            </a>
            <a href="#about" className="hover:text-slate-200 transition-colors">
              About Project
            </a>
          </div>
        </div>

        {/* Disclaimer & Operational Notice */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-slate-400 text-[11px] leading-relaxed">
          <div>
            <div>SecretPixel Security Systems · Advanced Cryptography &amp; Steganography Enclave</div>
            <div>Zero-Trust Client-Side Processing · Authenticated AES-256-GCM &amp; LSB Carrier Engine</div>
          </div>
          <div className="text-slate-400">
            100% In-Memory Browser Execution · Zero Telemetry
          </div>
        </div>
      </div>
    </footer>
  );
};
