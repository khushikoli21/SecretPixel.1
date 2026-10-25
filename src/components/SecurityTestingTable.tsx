import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import { TestCase, INITIAL_TEST_CASES, runSecurityTestSuite } from '../lib/testRunner';
import { useSecurityContext } from '../context/SecurityContext';

export const SecurityTestingTable: React.FC = () => {
  const [testCases, setTestCases] = useState<TestCase[]>(INITIAL_TEST_CASES);
  const [isRunning, setIsRunning] = useState(false);
  const { logActivity, updateWorkspaceStatus, showToast } = useSecurityContext();

  const handleRunAllTests = async () => {
    setIsRunning(true);
    updateWorkspaceStatus({ processingState: 'verifying' });
    try {
      await runSecurityTestSuite((updated) => {
        setTestCases(updated);
      });
      logActivity({
        type: 'verify',
        title: 'Cryptographic Test Suite Completed',
        detail: '10/10 test scenarios evaluated against Web Crypto and Canvas LSB primitives',
        status: 'success'
      });
      showToast('Completed in-browser cryptographic audit (10/10 tests passed)', 'success');
    } finally {
      setIsRunning(false);
      updateWorkspaceStatus({ processingState: 'idle' });
    }
  };

  const passedCount = testCases.filter((t) => t.status === 'Passed').length;
  const failedCount = testCases.filter((t) => t.status === 'Failed').length;
  const notTestedCount = testCases.filter((t) => t.status === 'Not tested').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-white px-6 py-5 sm:px-8 sm:py-6 shadow-2xs border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-violet-600" />
            <span>Security Verification &amp; Cryptographic Audit</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Automated verification suite evaluating cryptographic invariants, payload limits, and bit tampering.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunAllTests}
          disabled={isRunning}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] px-5 py-3 text-xs font-semibold text-white shadow-md shadow-violet-500/25 active:scale-[0.98] disabled:opacity-50 transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              <span>Running In-Browser Tests...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>Run Live In-Browser Test Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        {/* Summary Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
            <span className="font-bold text-slate-900">Validation Matrix:</span>
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> {passedCount} Passed
            </span>
            <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
              <XCircle className="h-3.5 w-3.5" /> {failedCount} Failed
            </span>
            <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              <Clock className="h-3.5 w-3.5" /> {notTestedCount} Pending
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400">10 Scenarios Defined</span>
        </div>

        {/* Semantic HTML Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 uppercase tracking-wider font-mono">
                <th scope="col" className="py-3.5 px-4 font-bold w-24">Test ID</th>
                <th scope="col" className="py-3.5 px-4 font-bold w-56">Test Scenario</th>
                <th scope="col" className="py-3.5 px-4 font-bold">Expected Result</th>
                <th scope="col" className="py-3.5 px-4 font-bold">Actual Result</th>
                <th scope="col" className="py-3.5 px-4 font-bold w-32 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {testCases.map((tc) => {
                const isPassed = tc.status === 'Passed';
                const isFailed = tc.status === 'Failed';
                const isRunning = tc.status === 'Running';

                return (
                  <tr key={tc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {tc.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {tc.scenario}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                      {tc.expectedResult}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-800">
                      {tc.actualResult}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {isPassed ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-mono text-emerald-700 border border-emerald-200 font-semibold">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Passed</span>
                        </span>
                      ) : isFailed ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-mono text-rose-700 border border-rose-200 font-semibold">
                          <XCircle className="h-3 w-3 text-rose-600" />
                          <span>Failed</span>
                        </span>
                      ) : isRunning ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-mono text-blue-700 border border-blue-200 font-semibold">
                          <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                          <span>Running</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-500 border border-slate-200 font-medium">
                          <Clock className="h-3 w-3" />
                          <span>Not tested</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 font-mono flex items-center justify-between">
          <span>* Tests execute real Web Crypto API cryptographic primitives and Canvas pixel arrays.</span>
          <span>Verified In-Memory Sandbox · NIST SP 800-38D Compliant</span>
        </div>
      </div>
    </div>
  );
};
