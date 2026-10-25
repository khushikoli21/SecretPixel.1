import React from 'react';
import { Cpu, ShieldCheck, Layers, Lock, AlertTriangle, FileCheck, KeyRound } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#09132C] px-6 py-5 sm:px-8 sm:py-6 shadow-sm border border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="h-6 w-6 text-blue-400" />
            <span>System Architecture &amp; Cryptographic Specifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Deterministic Galois/Counter Mode authenticated encryption coupled with RGB LSB steganography.
          </p>
        </div>
        <div className="text-xs font-mono bg-blue-950/80 px-3 py-1.5 rounded-xl border border-blue-800 text-blue-300 shrink-0">
          Specification v2.4-SEC
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Cryptographic Engine */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-mono">Cipher Subsystem</div>
                <h3 className="text-sm font-bold text-slate-900">AES-256-GCM Authenticated</h3>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Key Length:</span>
                <span className="text-slate-900 font-bold">256 Bits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tag Length:</span>
                <span className="text-slate-900 font-bold">128 Bits (Auth Tag)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IV Nonce:</span>
                <span className="text-blue-600 font-bold">96 Bits Random</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Key Derivation */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-mono">KDF Subsystem</div>
                <h3 className="text-sm font-bold text-slate-900">PBKDF2-HMAC-SHA-256</h3>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Iterations:</span>
                <span className="text-slate-900 font-bold">100,000 Rounds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Salt Entropy:</span>
                <span className="text-slate-900 font-bold">128 Bits Hardware</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Persistence:</span>
                <span className="text-emerald-600 font-bold">Zero Storage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Stego Carrier Protocol */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-mono">Carrier Subsystem</div>
                <h3 className="text-sm font-bold text-slate-900">SPXL Binary Protocol</h3>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Header Size:</span>
                <span className="text-slate-900 font-bold">37 Bytes Fixed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Channel Density:</span>
                <span className="text-slate-900 font-bold">3 Bits / Pixel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Carrier Target:</span>
                <span className="text-blue-600 font-bold">Lossless PNG</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Integrity Disclaimer */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Operational Security Principles</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-900 block mb-1">Lossless Media Requirement</strong>
            PNG export guarantees zero bit alteration. Lossy codecs (JPEG) strip LSB carrier channels.
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-900 block mb-1">Strict Authentication Tag</strong>
            Altering even 1 bit in transit fails AES-GCM tag verification, shielding plaintext from exposure.
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-900 block mb-1">Client-Authoritative Enclave</strong>
            All keys and plaintext reside solely in volatile tab memory and terminate when the tab is closed.
          </div>
        </div>
      </div>
    </div>
  );
};
