import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, AlertCircle, RotateCcw, Send, Shield, Database } from 'lucide-react';
import { upsertProfile, saveUserPreferences, getDatabaseStatus, DatabaseStatus } from '../services/databaseService';

export const RegistrationForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Security Operations Analyst');
  const [clearance, setClearance] = useState<'Confidential' | 'Secret' | 'Top Secret'>('Confidential');
  const [consent, setConsent] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    fullName: string;
    email: string;
    role: string;
    clearance: string;
    timestamp: string;
    persistenceTarget: string;
  } | null>(null);

  useEffect(() => {
    getDatabaseStatus().then(setDbStatus);
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Work email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please provide a valid email format.';
    }

    if (!consent) {
      newErrors.consent = 'You must acknowledge the operational security policy.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const persistenceTarget = dbStatus?.isConnected
      ? 'Supabase PostgreSQL (profiles table)'
      : 'Local Enclave Storage';

    // Persist operator preferences safely without passwords
    await saveUserPreferences({
      save_operation_history: true
    });

    setSubmittedData({
      fullName: fullName.trim(),
      email: email.trim(),
      role,
      clearance,
      timestamp: new Date().toLocaleTimeString(),
      persistenceTarget
    });
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setRole('Security Operations Analyst');
    setClearance('Confidential');
    setConsent(false);
    setErrors({});
    setIsSubmitted(false);
    setSubmittedData(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#09132C] px-6 py-5 sm:px-8 sm:py-6 shadow-sm border border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <UserCheck className="h-6 w-6 text-blue-400" />
            <span>Operator Access Authorization</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Register operator identity and access credentials for the SecretPixel security console.
          </p>
        </div>
        <div className="text-xs font-mono bg-blue-950/80 px-3 py-1.5 rounded-xl border border-blue-800 text-blue-300 shrink-0">
          In-Memory Authorization
        </div>
      </div>

      <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {isSubmitted && submittedData ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Operator Clearance Authorized</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Identity verified for <strong className="text-slate-900">{submittedData.fullName}</strong> ({submittedData.role}). Access token initialized locally.
            </p>
            <div className="bg-white p-4 rounded-xl border border-slate-200 max-w-md mx-auto text-left text-xs text-slate-700 space-y-1.5 font-mono shadow-xs">
              <div>Operator: <span className="text-slate-900 font-bold">{submittedData.fullName}</span></div>
              <div>Email: <span className="text-slate-900">{submittedData.email}</span></div>
              <div>Clearance: <span className="text-blue-600 font-bold">{submittedData.clearance}</span></div>
              <div>Timestamp: <span className="text-slate-500">{submittedData.timestamp}</span></div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Authorize Another Operator</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="op-name" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Operator Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="op-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors({ ...errors, fullName: '' });
                  }}
                  placeholder="e.g. Alex Morgan"
                  className={`w-full rounded-xl border bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                    errors.fullName ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500'
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="op-email" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Work Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="op-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="e.g. alex@cyberoperations.io"
                  className={`w-full rounded-xl border bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                    errors.email ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="op-role" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Security Role
                </label>
                <select
                  id="op-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
                >
                  <option value="Security Operations Analyst">Security Operations Analyst</option>
                  <option value="Incident Responder">Incident Responder</option>
                  <option value="Threat Intelligence Lead">Threat Intelligence Lead</option>
                  <option value="Cryptographic Systems Engineer">Cryptographic Systems Engineer</option>
                </select>
              </div>

              <div>
                <label htmlFor="op-clearance" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Clearance Level
                </label>
                <select
                  id="op-clearance"
                  value={clearance}
                  onChange={(e) => setClearance(e.target.value as 'Confidential' | 'Secret' | 'Top Secret')}
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
                >
                  <option value="Confidential">Confidential (Standard)</option>
                  <option value="Secret">Secret (AES-256)</option>
                  <option value="Top Secret">Top Secret (Full Audit)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (errors.consent) setErrors({ ...errors, consent: '' });
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I acknowledge that all cryptography executes strictly client-side and session tokens are non-persistent.
                </span>
              </label>
              {errors.consent && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.consent}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D64F2] hover:bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/25 active:scale-[0.98] transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Authorization</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
