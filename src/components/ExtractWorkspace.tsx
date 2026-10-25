import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  FileText,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { decryptMessage } from '../lib/crypto';
import { extractPayloadFromImageData } from '../lib/steganography';
import { ImageUploader, UploadedImageData } from './ImageUploader';
import { useSecurityContext } from '../context/SecurityContext';
import { recordOperationHistory } from '../services/databaseService';
import { extractMessageViaPython, checkBackendHealth } from '../services/apiService';

interface ExtractWorkspaceProps {
  transferredImage?: { dataUrl: string; filename: string } | null;
  onClearTransferredImage?: () => void;
}

export const ExtractWorkspace: React.FC<ExtractWorkspaceProps> = ({
  transferredImage,
  onClearTransferredImage
}) => {
  const { logActivity, updateWorkspaceStatus, showToast } = useSecurityContext();

  const [stegoImage, setStegoImage] = useState<UploadedImageData | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPythonOnline, setIsPythonOnline] = useState<boolean>(true);
  const [error, setError] = useState<{ title: string; message: string; type: 'tamper' | 'wrong_pass' | 'no_signature' | 'general' } | null>(null);

  const [recoveredMessage, setRecoveredMessage] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [payloadDetails, setPayloadDetails] = useState<{
    saltHex: string;
    ivHex: string;
    ciphertextLength: number;
    version: number;
  } | null>(null);

  useEffect(() => {
    checkBackendHealth().then((res) => setIsPythonOnline(res.isOnline));
  }, []);

  const passwordInputId = useId();

  // If an image was transferred from Hide workspace, load it automatically
  useEffect(() => {
    if (transferredImage) {
      const img = new Image();
      img.onload = () => {
        const imgData: UploadedImageData = {
          name: transferredImage.filename,
          size: Math.round(transferredImage.dataUrl.length * 0.75),
          width: img.naturalWidth,
          height: img.naturalHeight,
          dataUrl: transferredImage.dataUrl
        };
        setStegoImage(imgData);
        setError(null);
        setRecoveredMessage(null);
        logActivity({
          type: 'image_load',
          title: 'Stego-Image Received from Sender',
          detail: `${transferredImage.filename} (${img.naturalWidth}×${img.naturalHeight}px)`,
          status: 'info'
        });
        showToast(`Transferred ${transferredImage.filename} into Extract Console`, 'info');
      };
      img.src = transferredImage.dataUrl;
    }
  }, [transferredImage]);

  const handleImageChange = (newImage: UploadedImageData | null) => {
    setStegoImage(newImage);
    setError(null);
    setRecoveredMessage(null);
    setPayloadDetails(null);

    if (newImage) {
      logActivity({
        type: 'image_load',
        title: 'Stego-Image Uploaded',
        detail: `${newImage.name} (${newImage.width}×${newImage.height}px)`,
        status: 'info'
      });
      showToast(`Loaded ${newImage.name}`, 'info');
    }
  };

  const handleExtractAndDecrypt = async () => {
    setError(null);
    setRecoveredMessage(null);
    setPayloadDetails(null);

    if (!stegoImage) {
      setError({
        title: 'Image Required',
        message: 'Please upload a stego-image file to proceed with extraction.',
        type: 'general'
      });
      return;
    }
    if (!password) {
      setError({
        title: 'Passphrase Required',
        message: 'Decryption passphrase is required to authenticate and decrypt the payload.',
        type: 'general'
      });
      return;
    }

    setIsProcessing(true);
    updateWorkspaceStatus({ processingState: 'extracting' });
    const startTime = performance.now();

    try {
      let plaintext = '';
      let detailsExtracted: {
        saltHex: string;
        ivHex: string;
        ciphertextLength: number;
        version: number;
      } | null = null;
      let engine: 'python' | 'client' = 'client';

      // 1. Attempt Python Steganography Engine first
      if (isPythonOnline) {
        try {
          const pyRes = await extractMessageViaPython(stegoImage.dataUrl, password);
          plaintext = pyRes.message;
          detailsExtracted = {
            saltHex: pyRes.details?.saltHex ? pyRes.details.saltHex.slice(0, 16) + '...' : 'Verified (128-bit)',
            ivHex: pyRes.details?.ivHex ? pyRes.details.ivHex.slice(0, 16) + '...' : 'Verified (96-bit)',
            ciphertextLength: pyRes.payloadSizeBytes,
            version: pyRes.details?.version || 1
          };
          engine = 'python';
        } catch (pyErr: unknown) {
          const errMsg = pyErr instanceof Error ? pyErr.message : String(pyErr);
          if (errMsg.includes('Incorrect password') || errMsg.includes('No SecretPixel signature') || errMsg.includes('Authentication')) {
            throw pyErr;
          }
          console.warn('[ExtractWorkspace] Python API unavailable, falling back to client-side engine:', pyErr);
          setIsPythonOnline(false);
        }
      }

      // 2. Client-side WebCrypto Fallback
      if (!plaintext) {
        // Load image onto canvas
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image data onto browser canvas.'));
          img.src = stegoImage.dataUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Could not initialize 2D canvas context.');

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Extract binary payload from LSBs
        const extracted = extractPayloadFromImageData(imgData);

        // Authenticate and Decrypt with AES-256-GCM
        plaintext = await decryptMessage(
          extracted.ciphertextWithTag,
          password,
          extracted.salt,
          extracted.iv
        );

        const toHex = (buf: Uint8Array) =>
          Array.from(buf)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .slice(0, 16) + '...';

        detailsExtracted = {
          saltHex: toHex(extracted.salt),
          ivHex: toHex(extracted.iv),
          ciphertextLength: extracted.ciphertextWithTag.length,
          version: extracted.version
        };
        engine = 'client';
      }

      const durationMs = Math.round(performance.now() - startTime);

      setPayloadDetails(detailsExtracted);
      setRecoveredMessage(plaintext);

      // Persist non-sensitive operational summary
      recordOperationHistory({
        operation_type: 'decrypt',
        status: 'success',
        image_width: stegoImage.width,
        image_height: stegoImage.height,
        image_format: 'PNG',
        payload_size_bytes: detailsExtracted?.ciphertextLength || 0,
        processing_duration_ms: durationMs
      }).catch(() => {});

      const engineLabel = engine === 'python' ? 'Python 3.11 / Pillow LSB Engine' : 'Client-Side WebCrypto LSB Engine';
      logActivity({
        type: 'decrypt',
        title: `Message Decrypted (${engine === 'python' ? 'Python' : 'Client'})`,
        detail: `${engineLabel}: 128-bit AES-GCM tag verified · ${plaintext.length} characters plaintext recovered`,
        status: 'success'
      });
      showToast(`Decryption successful via ${engineLabel}!`, 'success');
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Unknown extraction error';

      let errorTitle = 'Extraction Failed';
      let errorType: 'tamper' | 'wrong_pass' | 'no_signature' | 'general' = 'general';
      let userMsg = rawMsg;

      if (rawMsg.includes('No SecretPixel signature')) {
        errorTitle = 'Missing Signature (No Hidden Payload)';
        errorType = 'no_signature';
        userMsg = 'No SecretPixel "SPXL" magic signature was detected in this image. Either this is an unmodified image or it was compressed using lossy JPEG format.';
      } else if (rawMsg.includes('operation failed') || rawMsg.includes('tag') || rawMsg.includes('authentication')) {
        errorTitle = 'Authentication Tag Mismatch';
        errorType = 'wrong_pass';
        userMsg = 'Decryption failed: Incorrect passphrase, or the stego-image pixels were modified in transit. AES-256-GCM prevented ciphertext tampering.';
      }

      setError({
        title: errorTitle,
        message: userMsg,
        type: errorType
      });

      recordOperationHistory({
        operation_type: 'decrypt',
        status: 'failed',
        image_width: stegoImage?.width,
        image_height: stegoImage?.height,
        image_format: 'PNG'
      }).catch(() => {});

      logActivity({
        type: 'error',
        title: errorTitle,
        detail: userMsg,
        status: 'error'
      });
      showToast(errorTitle, 'error');
    } finally {
      setIsProcessing(false);
      updateWorkspaceStatus({ processingState: 'idle' });
    }
  };

  const handleCopy = async () => {
    if (!recoveredMessage) return;
    try {
      await navigator.clipboard.writeText(recoveredMessage);
      setHasCopied(true);
      showToast('Copied decrypted plaintext to clipboard!', 'success');
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleClear = () => {
    setStegoImage(null);
    setPassword('');
    setError(null);
    setRecoveredMessage(null);
    setPayloadDetails(null);
    if (onClearTransferredImage) onClearTransferredImage();
    showToast('Extract console cleared', 'info');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 border border-violet-200">
              <Unlock className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Extract Message
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Extract LSB bitstreams from PNG stego-images and authenticate ciphertext using AES-256-GCM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-violet-50 border border-violet-200 text-violet-700 px-3 py-1 rounded-xl font-semibold">
            Strict Tag Verification
          </span>
        </div>
      </div>

      {/* 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Upload & Passphrase Entry (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Image Upload Area using Reusable ImageUploader */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <ImageUploader
              label="1. Upload Stego-Image (PNG)"
              helperText="Drop your SecretPixel stego-image here. Lossless PNG format preserves embedded LSBs."
              value={stegoImage}
              onChange={handleImageChange}
              onError={(msg) => {
                setError({ title: 'Invalid Image', message: msg, type: 'general' });
                showToast(msg, 'error');
              }}
              requiredFormatNote="Lossless PNG"
            />
          </div>

          {/* Passphrase Input Area */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-2.5">
            <label
              htmlFor={passwordInputId}
              className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
            >
              2. Enter Decryption Passphrase
            </label>
            <div className="relative">
              <input
                id={passwordInputId}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the passphrase used during encryption"
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Passphrase is used with the extracted salt to re-derive the 256-bit AES key via PBKDF2.
            </p>
          </div>

          {/* Error Message with Specific Diagnosis */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <div className="font-bold text-rose-800 mb-0.5">{error.title}</div>
                <div className="text-[11px] leading-relaxed text-rose-700">{error.message}</div>
              </div>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExtractAndDecrypt}
              disabled={isProcessing}
              className="flex-1 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Extracting Bits &amp; Authenticating Decryption...</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>Extract &amp; Decrypt Payload</span>
                </>
              )}
            </button>

            {(stegoImage || password || recoveredMessage) && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Start Over"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Recovered Plaintext & Cryptographic Proof (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {recoveredMessage !== null ? (
            <div className="rounded-2xl border border-emerald-300 bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Message Recovered Successfully</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-semibold">
                  128-bit GCM Tag Validated
                </span>
              </div>

              <div className="text-xs text-slate-500 mb-2 font-mono font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-violet-600" />
                <span>Decrypted Confidential Plaintext:</span>
              </div>

              {/* Recovered Message Display */}
              <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-4 font-mono text-sm text-slate-900 whitespace-pre-wrap select-all leading-relaxed max-h-72 overflow-y-auto">
                {recoveredMessage}
              </div>

              {/* Action Buttons: One-Click Copy */}
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>{recoveredMessage.length} characters</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                  >
                    {hasCopied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                    <span>{hasCopied ? 'Copied to Clipboard!' : 'Copy Plaintext'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveredMessage(null)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium cursor-pointer"
                  >
                    Clear Text
                  </button>
                </div>
              </div>

              {/* Cryptographic Proof Details */}
              {payloadDetails && (
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payload Protocol:</span>
                    <span className="text-slate-800 font-bold">SPXL v{payloadDetails.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ciphertext Length:</span>
                    <span className="text-slate-800 font-bold">{payloadDetails.ciphertextLength} Bytes (with 128b Tag)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Extracted PBKDF2 Salt:</span>
                    <span className="text-slate-700 font-medium">{payloadDetails.saltHex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Extracted AES-GCM IV:</span>
                    <span className="text-slate-700 font-medium">{payloadDetails.ivHex}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-600" />
                <span>Verification Pipeline &amp; Invariants</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  SecretPixel extraction executes strict deterministic cryptographic validations:
                </p>
                <ol className="list-decimal pl-4 space-y-2 text-slate-700">
                  <li>
                    <strong className="text-slate-900">Header Inspection:</strong> Scans the first 37 bytes of LSB data for the <code className="text-violet-700 font-mono font-bold bg-violet-50 px-1 py-0.5 rounded border border-violet-200">SPXL</code> magic signature and protocol version.
                  </li>
                  <li>
                    <strong className="text-slate-900">PBKDF2 Key Derivation:</strong> Re-derives the 256-bit AES key using 100,000 SHA-256 rounds from your passphrase and the 128-bit salt embedded in the image header.
                  </li>
                  <li>
                    <strong className="text-slate-900">AES-GCM Authenticated Decryption:</strong> Validates the 128-bit authentication tag. If the passphrase is wrong or any pixel bit was corrupted, authentication fails instantly and no corrupted plaintext is released.
                  </li>
                </ol>
                <div className="mt-4 p-3.5 rounded-xl bg-violet-50/70 border border-violet-200 text-[11px] text-violet-900 font-medium">
                  💡 Tip: You can test immediate verification by using the &quot;Send to Extract Console&quot; button in the Hide Message workspace.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
