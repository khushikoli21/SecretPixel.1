import React, { useState } from 'react';
import { KeyRound, Shield, FileImage, Download, Unlock, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const [pipelineDirection, setPipelineDirection] = useState<'forward' | 'reverse'>('forward');

  const steps = [
    {
      num: '01',
      title: 'Compose Confidential Text',
      desc: 'The sender composes secret text in browser memory. Content is processed entirely client-side and never touches remote servers or telemetry streams.',
      icon: KeyRound,
      color: 'text-violet-600 bg-violet-50 border-violet-200'
    },
    {
      num: '02',
      title: 'Derive Key & Encrypt',
      desc: 'PBKDF2 derives a 256-bit AES key with 100,000 SHA-256 iterations and random salt. AES-GCM generates ciphertext with a 128-bit authentication tag.',
      icon: Shield,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      num: '03',
      title: 'LSB Bit Modulation',
      desc: 'Ciphertext bytes and the 37-byte SPXL header are encoded into the least significant bit (Bit 0) of Red, Green, and Blue pixel channels.',
      icon: FileImage,
      color: 'text-sky-600 bg-sky-50 border-sky-200'
    },
    {
      num: '04',
      title: 'Export Lossless PNG',
      desc: 'The browser canvas encodes a PNG file. Lossless compression ensures every pixel bit survives saving and sharing without compression loss.',
      icon: Download,
      color: 'text-teal-600 bg-teal-50 border-teal-200'
    },
    {
      num: '05',
      title: 'Extract & Authenticate',
      desc: 'The receiver uploads the image and enters the shared passphrase. SecretPixel extracts bits, derives the key, and validates the 128-bit tag.',
      icon: Unlock,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 border border-violet-200">
              <Layers className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              How It Works
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Dual-Layer Defense: Cryptography ensures mathematical confidentiality; Steganography conceals existence.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setPipelineDirection('forward')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              pipelineDirection === 'forward'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sender Flow
          </button>
          <button
            onClick={() => setPipelineDirection('reverse')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              pipelineDirection === 'reverse'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Receiver Flow
          </button>
        </div>
      </div>

      {/* 5 Horizontal Pipeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {(pipelineDirection === 'forward' ? steps : [...steps].reverse()).map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-violet-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-extrabold text-violet-700">
                    {pipelineDirection === 'forward' ? `STEP 0${idx + 1}` : `STEP 0${5 - idx}`}
                  </span>
                  <div className={`p-2 rounded-xl border ${s.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5">{s.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Matrix */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">Core Security Paradigm Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2">
            <span className="text-[11px] font-mono font-bold text-violet-700 uppercase">1. Cryptography</span>
            <h4 className="text-sm font-bold text-slate-900">Protects Message Contents</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Uses AES-256 to convert plaintext to unreadable ciphertext. Interceptors without the key see only high-entropy pseudo-random bytes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2">
            <span className="text-[11px] font-mono font-bold text-sky-700 uppercase">2. Steganography</span>
            <h4 className="text-sm font-bold text-slate-900">Conceals Message Existence</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Substitutes RGB least significant bits. Observers viewing the image see ordinary photos or artwork without visible encryption indicators.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200 space-y-2">
            <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>3. SecretPixel Combination</span>
            </span>
            <h4 className="text-sm font-bold text-slate-900">Defense in Depth</h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              Encrypt first, then conceal. Even if steganalysis suspects hidden bits, the adversary cannot read the contents without the 256-bit AES key.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
