import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  Layers,
  KeyRound,
  EyeOff,
  ArrowRight,
  Cpu,
  Binary,
  CheckCircle2,
  FileText,
  Activity,
  Sliders,
  Check,
  AlertTriangle,
  Clock,
  HardDrive,
  Download,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { ActiveView } from '../Sidebar';
import { useSecurityContext } from '../../context/SecurityContext';

interface OverviewViewProps {
  onNavigate: (view: ActiveView) => void;
  onQuickStart?: (message: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate, onQuickStart }) => {
  const [quickInput, setQuickInput] = useState('');
  const { activities, workspaceStatus, clearActivities } = useSecurityContext();

  const handleStartHiding = (e: React.FormEvent) => {
    e.preventDefault();
    if (onQuickStart && quickInput.trim()) {
      onQuickStart(quickInput.trim());
    }
    onNavigate('hide');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Welcome Heading & Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-2xs">
        {/* Subtle decorative glow accents matching reference palette */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-600 animate-pulse"></span>
              <span>AES-256-GCM + LSB Pixel Embedding</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Your Messages. <br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-sky-600 bg-clip-text text-transparent">
                Hidden in Plain Sight.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Encrypt confidential text with authenticated AES-GCM and imperceptibly weave ciphertext into cover image pixels. Secure, verifiable, and 100% client-side.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => onNavigate('hide')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                <span>Hide a Message</span>
              </button>

              <button
                onClick={() => onNavigate('extract')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition-all cursor-pointer"
              >
                <Unlock className="h-4 w-4 text-violet-600" />
                <span>Extract a Message</span>
              </button>
            </div>
          </div>

          {/* Right Column: Quick Launch Pad Form */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200/90 bg-[#F8FAFC] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  Quick Launch Input
                </span>
                <span className="font-mono text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Zero-Storage</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Type secret text below to immediately populate the encryption studio:
              </p>

              <form onSubmit={handleStartHiding} className="space-y-3">
                <textarea
                  rows={3}
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="e.g. Confidential credentials: 0x9A4F..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <span>Launch in Sender Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Section (4 Compact Action Cards) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-600" />
              <span>Quick Actions</span>
            </h2>
            <p className="text-xs text-slate-500">Direct shortcuts to core cryptographic and steganographic tools</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hide a Message */}
          <div
            onClick={() => onNavigate('hide')}
            className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-violet-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-200 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                Hide a Message
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Encrypt plaintext with AES-256-GCM and encode ciphertext into cover image pixels.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-violet-700 font-semibold flex items-center gap-1.5">
              <span>Open Sender Studio</span>
            </div>
          </div>

          {/* Card 2: Extract a Message */}
          <div
            onClick={() => onNavigate('extract')}
            className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-sky-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  <Unlock className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                Extract a Message
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Extract LSB bitstreams from PNG stego-images and authenticate with your passphrase.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-sky-700 font-semibold flex items-center gap-1.5">
              <span>Open Extract Console</span>
            </div>
          </div>

          {/* Card 3: Verify an Image */}
          <div
            onClick={() => onNavigate('verification')}
            className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Cpu className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Verify an Image
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Run automated tests for tamper detection, AES tag integrity, and bit precision.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1.5">
              <span>Security Testing Matrix</span>
            </div>
          </div>

          {/* Card 4: Inspect Image Bits */}
          <div
            onClick={() => onNavigate('inspector')}
            className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-rose-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <Sliders className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                Inspect Image Bits
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Deconstruct RGB color planes into 8 bit layers and inspect individual bit 0 modulations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-rose-700 font-semibold flex items-center gap-1.5">
              <span>Open Bit Inspector</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Secure Message Workflow (Sender & Receiver Pipelines) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Binary className="h-4 w-4 text-violet-600" />
            <span>Secure Message Workflow</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end cryptographic and steganographic pipeline implemented in the SecretPixel engine
          </p>
        </div>

        {/* Sender Workflow */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2 font-mono">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">
              A
            </span>
            <span>Sender Pipeline: Embedding Process</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-center">
              <div className="text-[10px] font-mono text-violet-600 font-semibold mb-1">Step 1</div>
              <div className="text-xs font-bold text-slate-900">Select Image</div>
              <div className="text-[11px] text-slate-500 mt-1">PNG, JPEG, WebP cover</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-center">
              <div className="text-[10px] font-mono text-violet-600 font-semibold mb-1">Step 2</div>
              <div className="text-xs font-bold text-slate-900">Enter Message</div>
              <div className="text-[11px] text-slate-500 mt-1">Confidential text</div>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 text-center">
              <div className="text-[10px] font-mono text-violet-700 font-semibold mb-1">Step 3</div>
              <div className="text-xs font-bold text-slate-900">AES-256-GCM</div>
              <div className="text-[11px] text-slate-500 mt-1">PBKDF2 100k + 128b tag</div>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-center">
              <div className="text-[10px] font-mono text-sky-700 font-semibold mb-1">Step 4</div>
              <div className="text-xs font-bold text-slate-900">Embed Using LSB</div>
              <div className="text-[11px] text-slate-500 mt-1">3 bits / pixel (RGB)</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
              <div className="text-[10px] font-mono text-emerald-700 font-semibold mb-1">Step 5</div>
              <div className="text-xs font-bold text-slate-900">Download PNG</div>
              <div className="text-[11px] text-slate-500 mt-1">Lossless stego-image</div>
            </div>
          </div>
        </div>

        {/* Connecting Divider */}
        <div className="border-t border-slate-100"></div>

        {/* Receiver Workflow */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2 font-mono">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold">
              B
            </span>
            <span>Receiver Pipeline: Extraction Process</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-center">
              <div className="text-[10px] font-mono text-sky-600 font-semibold mb-1">Step 1</div>
              <div className="text-xs font-bold text-slate-900">Upload Stego Image</div>
              <div className="text-[11px] text-slate-500 mt-1">Lossless PNG format</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-center">
              <div className="text-[10px] font-mono text-sky-600 font-semibold mb-1">Step 2</div>
              <div className="text-xs font-bold text-slate-900">Enter Passphrase</div>
              <div className="text-[11px] text-slate-500 mt-1">Sender's password</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 text-center">
              <div className="text-[10px] font-mono text-sky-600 font-semibold mb-1">Step 3</div>
              <div className="text-xs font-bold text-slate-900">Extract Payload</div>
              <div className="text-[11px] text-slate-500 mt-1">Validate SPXL header</div>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 text-center">
              <div className="text-[10px] font-mono text-violet-700 font-semibold mb-1">Step 4</div>
              <div className="text-xs font-bold text-slate-900">Auth &amp; Decrypt</div>
              <div className="text-[11px] text-slate-500 mt-1">128-bit tag verified</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
              <div className="text-[10px] font-mono text-emerald-700 font-semibold mb-1">Step 5</div>
              <div className="text-xs font-bold text-slate-900">Copy Plaintext</div>
              <div className="text-[11px] text-slate-500 mt-1">1-click clipboard copy</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real-time Status & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Workspace Status (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-violet-600" />
                <span>Image Workspace Status</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Live state of current in-memory workspace</p>
            </div>
            <span
              className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                workspaceStatus.coverImage
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              {workspaceStatus.coverImage ? 'Cover Loaded' : 'No Image'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {/* Cover Image Status */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
              <span className="text-slate-500 font-medium">Cover Image:</span>
              <span className="text-slate-900 font-bold truncate max-w-[200px]">
                {workspaceStatus.coverImage ? workspaceStatus.coverImage.name : 'Not selected'}
              </span>
            </div>

            {/* Dimensions */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
              <span className="text-slate-500 font-medium">Dimensions:</span>
              <span className="text-violet-700 font-bold">
                {workspaceStatus.coverImage
                  ? `${workspaceStatus.coverImage.width} × ${workspaceStatus.coverImage.height} px`
                  : 'Not available'}
              </span>
            </div>

            {/* Estimated Capacity */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
              <span className="text-slate-500 font-medium">Payload Capacity:</span>
              <span className="text-slate-900 font-bold">
                {workspaceStatus.maxCapacityBytes !== null
                  ? `${workspaceStatus.maxCapacityBytes.toLocaleString()} Bytes`
                  : 'Not available'}
              </span>
            </div>

            {/* Payload Preparation */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
              <span className="text-slate-500 font-medium">Payload Preparation:</span>
              <span
                className={
                  workspaceStatus.payloadPrepared
                    ? 'text-emerald-700 font-bold flex items-center gap-1'
                    : 'text-slate-400'
                }
              >
                {workspaceStatus.payloadPrepared ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    Ready to embed
                  </>
                ) : (
                  'Pending message & passphrase'
                )}
              </span>
            </div>

            {/* Encoded Image Availability */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
              <span className="text-slate-500 font-medium">Stego-PNG Output:</span>
              <span
                className={
                  workspaceStatus.stegoImageReady
                    ? 'text-emerald-700 font-bold flex items-center gap-1'
                    : 'text-slate-400'
                }
              >
                {workspaceStatus.stegoImageReady ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Ready for download
                  </>
                ) : (
                  'None generated'
                )}
              </span>
            </div>

            {/* Processing State */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
              <span className="text-slate-500 font-medium">Engine State:</span>
              <span className="text-violet-700 font-bold capitalize">
                {workspaceStatus.processingState === 'idle' ? 'Idle / Ready' : `${workspaceStatus.processingState}...`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity Log (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-violet-600" />
                <span>Recent Activity</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Events recorded during current application session</p>
            </div>
            {activities.length > 0 && (
              <button
                type="button"
                onClick={clearActivities}
                className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                title="Clear Activity Log"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {activities.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Clock className="h-5 w-5" />
              </div>
              <div className="text-xs font-bold text-slate-700">No session operations yet</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Actions like loading cover images, encrypting text, downloading stego-PNGs, or extracting messages will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-2.5 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                        act.status === 'success'
                          ? 'bg-emerald-500 shadow-[0_0_6px_#10B981]'
                          : act.status === 'error'
                          ? 'bg-rose-500 shadow-[0_0_6px_#F43F5E]'
                          : act.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-violet-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">{act.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{act.detail}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">{act.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Security & Privacy Status + Quick Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Security & Privacy Status Card (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-600" />
              <span>Security &amp; Privacy Architecture</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Guaranteed cryptographic safeguards &amp; privacy assurances</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-violet-700 font-bold font-mono text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>100% In-Memory</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Images, text, and keys never touch a remote server. Execution runs strictly in local browser memory.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold font-mono text-[11px]">
                <KeyRound className="h-3.5 w-3.5" />
                <span>AES-256-GCM + Tag</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Authenticated encryption with 128-bit integrity tag. Modifying even one bit triggers instant failure.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-sky-700 font-bold font-mono text-[11px]">
                <Cpu className="h-3.5 w-3.5" />
                <span>PBKDF2 100k Rounds</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                100,000 iterations of SHA-256 with 128-bit random salt protect passphrases against brute-force attacks.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold font-mono text-[11px]">
                <Layers className="h-3.5 w-3.5" />
                <span>Lossless PNG Integrity</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Only bit 0 of RGB color channels is modulated, ensuring zero perceptual distortion and high PSNR.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Guidance / Steganography Best Practices (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-violet-600" />
              <span>Operational Guidance</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Essential rules for secure image steganography</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-700 text-xs font-bold shrink-0">
                1
              </div>
              <div>
                <strong className="text-slate-900 block font-semibold">Always distribute images as PNG</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lossy compression (JPEG, social media compression) will discard pixel LSBs, corrupting the payload.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-700 text-xs font-bold shrink-0">
                2
              </div>
              <div>
                <strong className="text-slate-900 block font-semibold">Store your passphrases securely</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  SecretPixel has no master keys, escrow, or backdoor recovery. If the password is lost, data is unrecoverable.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-700 text-xs font-bold shrink-0">
                3
              </div>
              <div>
                <strong className="text-slate-900 block font-semibold">Payload capacity scales with resolution</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Each pixel provides 3 bits (1 bit per RGB channel). An 800×600 px image can securely hold ~179 KB.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-700 text-xs font-bold shrink-0">
                4
              </div>
              <div>
                <strong className="text-slate-900 block font-semibold">Do not re-edit pixels after encoding</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cropping, resizing, applying photo filters, or color adjustments will invalidate the AES-GCM tag.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
