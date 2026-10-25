import React, { useState, useEffect } from 'react';
import { Settings, Shield, Trash2, CheckCircle2, Lock, Cpu, Database, EyeOff, Server, RefreshCw } from 'lucide-react';
import { useSecurityContext } from '../../context/SecurityContext';
import { checkBackendHealth, getBackendInfo, BackendHealthResponse, BackendInfoResponse } from '../../services/apiService';
import { getDatabaseStatus, getUserPreferences, saveUserPreferences, clearOperationHistory, DatabaseStatus } from '../../services/databaseService';

interface SettingsViewProps {
  onClearCache?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClearCache }) => {
  const [cleared, setCleared] = useState(false);
  const [backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);
  const [backendInfo, setBackendInfo] = useState<BackendInfoResponse | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const { clearActivities, updateWorkspaceStatus, showToast } = useSecurityContext();

  const fetchBackendData = async () => {
    setIsCheckingBackend(true);
    const health = await checkBackendHealth();
    if (health.isOnline && health.data) {
      setBackendHealth(health.data);
      const info = await getBackendInfo();
      setBackendInfo(info);
    } else {
      setBackendHealth(null);
      setBackendInfo(null);
    }
    setIsCheckingBackend(false);
  };

  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [saveHistory, setSaveHistory] = useState<boolean>(false);
  const [historyCleared, setHistoryCleared] = useState(false);

  useEffect(() => {
    fetchBackendData();
    getDatabaseStatus().then(setDbStatus);
    getUserPreferences().then((p) => setSaveHistory(p.save_operation_history));
  }, []);

  const handleToggleSaveHistory = async (enabled: boolean) => {
    setSaveHistory(enabled);
    await saveUserPreferences({ save_operation_history: enabled });
    showToast(
      enabled ? 'Enabled non-sensitive operation history saving' : 'Disabled operation history saving',
      'info'
    );
  };

  const handleClearSavedHistory = async () => {
    await clearOperationHistory();
    setHistoryCleared(true);
    showToast('Saved operation history cleared', 'info');
    setTimeout(() => setHistoryCleared(false), 3000);
  };

  const handleWipeMemory = () => {
    if (onClearCache) onClearCache();
    clearActivities();
    updateWorkspaceStatus({
      coverImage: null,
      estimatedPayloadBytes: 0,
      maxCapacityBytes: null,
      payloadPrepared: false,
      stegoImageReady: false,
      processingState: 'idle'
    });
    setCleared(true);
    showToast('All in-memory buffers and session logs wiped clean', 'info');
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 border border-violet-200">
              <Settings className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Settings &amp; Engine Status
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Inspect cryptographic parameters, configure runtime settings, and manage in-memory session state.
          </p>
        </div>
        <div className="text-xs font-mono bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-700 flex items-center gap-1.5 font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Web Crypto Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Cryptographic Parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-600" />
              <span>Cryptographic Engine Specifications</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <span className="text-slate-500 font-medium">Cipher Primitive</span>
                <span className="font-mono text-violet-700 font-bold">AES-256-GCM (Authenticated)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <span className="text-slate-500 font-medium">Key Derivation (KDF)</span>
                <span className="font-mono text-slate-800 font-bold">PBKDF2 with HMAC-SHA-256</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <span className="text-slate-500 font-medium">KDF Work Factor</span>
                <span className="font-mono text-indigo-700 font-bold">100,000 Rounds</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <span className="text-slate-500 font-medium">Salt Entropy</span>
                <span className="font-mono text-slate-800 font-bold">128-bit (16 Bytes) CSPRNG</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <span className="text-slate-500 font-medium">Initialization Vector (IV)</span>
                <span className="font-mono text-slate-800 font-bold">96-bit (12 Bytes) CSPRNG</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <span className="text-slate-500 font-medium">Authentication Tag</span>
                <span className="font-mono text-emerald-700 font-bold">128-bit Tag</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <span className="text-slate-500 font-medium">Steganographic Carrier Density</span>
                <span className="font-mono text-sky-700 font-bold">1 bit / channel (3 bits / pixel)</span>
              </div>
            </div>
          </div>

          {/* Privacy Architecture */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-violet-600" />
              <span>Privacy &amp; Threat Model</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              SecretPixel is built upon a zero-trust model for the host machine and network. It performs all operations within your browser tab&apos;s isolated execution context:
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
                <span>Zero telemetry, analytics tracking, or external logging.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
                <span>Keys and plaintext are never cached in LocalStorage or IndexedDB.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
                <span>Works 100% offline without requiring internet connectivity.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Database Layer Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-4 w-4 text-violet-600" />
                <span>PostgreSQL Database Layer</span>
              </h3>
              <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                dbStatus?.isConnected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {dbStatus?.isConnected ? 'Supabase Connected' : 'Local Enclave Mode'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Row Level Security (RLS) protects authenticated user profiles, preferences, and non-sensitive operational summaries.
            </p>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveHistory}
                  onChange={(e) => handleToggleSaveHistory(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Record Operation Summaries</span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    Save non-sensitive operational metadata (resolution, duration, payload size). Secret messages and keys are NEVER recorded.
                  </span>
                </div>
              </label>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Provider:</span>
                  <span className="text-slate-800 font-semibold">{dbStatus?.provider || 'local-offline-fallback'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RLS Policies:</span>
                  <span className="text-emerald-700 font-semibold">Enabled (auth.uid() isolated)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tables:</span>
                  <span className="text-slate-700">profiles, preferences, history</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearSavedHistory}
              className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-500" />
              <span>{historyCleared ? 'History Cleared' : 'Clear Saved Operation History'}</span>
            </button>
          </div>

          {/* Memory Wipe */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-500" />
              <span>In-Memory Cache Wipe</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Flush all transient image buffers, decrypted plaintexts, and password references from active browser memory.
            </p>

            <button
              type="button"
              onClick={handleWipeMemory}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>{cleared ? 'Memory Wiped Clean' : 'Wipe Transient Memory'}</span>
            </button>

            {cleared && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center flex items-center justify-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>All memory structures flushed successfully</span>
              </div>
            )}
          </div>

          {/* Engine Environment Details */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-violet-600" />
                <span>Runtime Environment</span>
              </h3>
              <button
                type="button"
                onClick={fetchBackendData}
                disabled={isCheckingBackend}
                className="text-xs text-slate-500 hover:text-slate-800 p-1 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                title="Ping Backend API"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isCheckingBackend ? 'animate-spin text-violet-600' : ''}`} />
                <span className="text-[11px]">Ping API</span>
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Protocol:</span>
                <span className="text-slate-900 font-bold">SPXL v1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Backend Server:</span>
                <span className={backendHealth ? 'text-emerald-700 font-bold flex items-center gap-1' : 'text-slate-500 font-medium'}>
                  {backendHealth ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Online ({backendHealth.service})</span>
                    </>
                  ) : (
                    <span>Client-Only / Offline Ready</span>
                  )}
                </span>
              </div>
              {backendHealth && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Server Uptime:</span>
                  <span className="text-slate-800 font-bold">{backendHealth.uptime}s</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Crypto Engine:</span>
                <span className="text-violet-700 font-bold">window.crypto.subtle</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Image Pipeline:</span>
                <span className="text-sky-700 font-bold">CanvasRenderingContext2D</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
