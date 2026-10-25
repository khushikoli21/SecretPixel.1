import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Zap,
  Shield,
  Layers,
  FileCheck2,
  RotateCcw
} from 'lucide-react';
import { encryptMessage, evaluatePasswordStrength } from '../lib/crypto';
import {
  calculateCapacity,
  buildPayload,
  embedPayloadIntoImageData,
  calculateImageMetrics,
  CapacityInfo,
  StegoMetrics
} from '../lib/steganography';
import { SAMPLE_IMAGES } from '../lib/sampleImages';
import { ImageUploader, UploadedImageData } from './ImageUploader';
import { ImageComparisonViewer } from './ImageComparisonViewer';
import { useSecurityContext } from '../context/SecurityContext';
import { recordOperationHistory } from '../services/databaseService';
import { hideMessageViaPython, checkBackendHealth } from '../services/apiService';

interface HideWorkspaceProps {
  onTransferToExtract?: (dataUrl: string, filename: string) => void;
  initialMessage?: string;
}

export const HideWorkspace: React.FC<HideWorkspaceProps> = ({
  onTransferToExtract,
  initialMessage = ''
}) => {
  const { logActivity, updateWorkspaceStatus, showToast } = useSecurityContext();

  // Form state
  const [message, setMessage] = useState(initialMessage);
  const [showMessage, setShowMessage] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Accessible unique IDs
  const messageInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();

  // Image state
  const [coverImageFile, setCoverImageFile] = useState<UploadedImageData | null>(null);

  // Status and results
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPythonOnline, setIsPythonOnline] = useState<boolean>(true);
  const [lastEngineUsed, setLastEngineUsed] = useState<'python' | 'client' | null>(null);
  const [stegoResult, setStegoResult] = useState<{
    dataUrl: string;
    filename: string;
    sizeBytes: number;
    metrics: StegoMetrics;
  } | null>(null);

  // Check Python backend on mount
  useEffect(() => {
    checkBackendHealth().then((res) => {
      setIsPythonOnline(res.isOnline);
    });
  }, []);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load preset on mount if empty
  useEffect(() => {
    if (!coverImageFile) {
      loadPresetImage('cyber-matrix');
    }
  }, []);

  // Update initial message if changed externally
  useEffect(() => {
    if (initialMessage && !message) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  function loadPresetImage(presetId: string) {
    const preset = SAMPLE_IMAGES.find((p) => p.id === presetId) || SAMPLE_IMAGES[0];
    const dataUrl = preset.getDataUrl();
    const img = new Image();
    img.onload = () => {
      const imageData: UploadedImageData = {
        name: `${preset.name}.png`,
        size: Math.round(dataUrl.length * 0.75),
        width: img.naturalWidth,
        height: img.naturalHeight,
        dataUrl,
        isPreset: true
      };
      setCoverImageFile(imageData);
      setError(null);
      setStegoResult(null);

      const cap = calculateCapacity(img.naturalWidth, img.naturalHeight);
      updateWorkspaceStatus({
        coverImage: {
          name: imageData.name,
          width: imageData.width,
          height: imageData.height,
          sizeBytes: imageData.size
        },
        maxCapacityBytes: cap.usablePayloadBytes,
        stegoImageReady: false
      });

      logActivity({
        type: 'image_load',
        title: 'Cover Image Selected',
        detail: `${preset.name}.png (${img.naturalWidth}×${img.naturalHeight}px) - Capacity: ${cap.usablePayloadBytes.toLocaleString()} B`,
        status: 'info'
      });
    };
    img.src = dataUrl;
  }

  const handleImageChange = (newImage: UploadedImageData | null) => {
    setCoverImageFile(newImage);
    setStegoResult(null);
    setError(null);

    if (newImage) {
      const cap = calculateCapacity(newImage.width, newImage.height);
      updateWorkspaceStatus({
        coverImage: {
          name: newImage.name,
          width: newImage.width,
          height: newImage.height,
          sizeBytes: newImage.size
        },
        maxCapacityBytes: cap.usablePayloadBytes,
        stegoImageReady: false
      });

      logActivity({
        type: 'image_load',
        title: 'Custom Image Uploaded',
        detail: `${newImage.name} (${newImage.width}×${newImage.height}px)`,
        status: 'success'
      });
      showToast(`Loaded ${newImage.name}`, 'info');
    } else {
      updateWorkspaceStatus({
        coverImage: null,
        maxCapacityBytes: null,
        stegoImageReady: false
      });
    }
  };

  const capacity: CapacityInfo | null = coverImageFile
    ? calculateCapacity(coverImageFile.width, coverImageFile.height)
    : null;

  // Header overhead: 37 bytes header + 16 bytes AES-GCM tag
  const estimatedPayloadBytes = message ? new TextEncoder().encode(message).length + 16 + 37 : 0;
  const isOverCapacity = capacity ? estimatedPayloadBytes > capacity.usablePayloadBytes : false;
  const capacityUsedPercent =
    capacity && capacity.usablePayloadBytes > 0
      ? Math.min(100, Number(((estimatedPayloadBytes / capacity.usablePayloadBytes) * 100).toFixed(1)))
      : 0;

  // Sync workspace status when message changes
  useEffect(() => {
    updateWorkspaceStatus({
      estimatedPayloadBytes,
      payloadPrepared: message.trim().length > 0 && password.length > 0 && password === confirmPassword
    });
  }, [message, password, confirmPassword, estimatedPayloadBytes, updateWorkspaceStatus]);

  const passwordStrength = evaluatePasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleEncryptAndHide = async () => {
    setError(null);

    if (!message.trim()) {
      setError('Please enter the secret message you wish to protect.');
      return;
    }
    if (!password) {
      setError('A secure encryption passphrase is required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passphrase and confirmation passphrase do not match.');
      return;
    }
    if (!coverImageFile) {
      setError('Please select or upload a cover image.');
      return;
    }
    if (isOverCapacity) {
      setError(
        `Payload size (${estimatedPayloadBytes} B) exceeds maximum image capacity (${capacity?.usablePayloadBytes.toLocaleString()} B). Choose a larger image or shorten the message.`
      );
      return;
    }

    setIsProcessing(true);
    updateWorkspaceStatus({ processingState: 'encrypting' });
    const startTime = performance.now();

    try {
      let stegoPngDataUrl = '';
      let metrics: StegoMetrics | null = null;
      let engine: 'python' | 'client' = 'client';
      let payloadSizeBytes = 0;

      // 1. Attempt Python Steganography Engine first
      if (isPythonOnline) {
        try {
          const pyRes = await hideMessageViaPython(coverImageFile.dataUrl, message, password);
          stegoPngDataUrl = pyRes.stegoImageBase64;
          metrics = pyRes.metrics;
          payloadSizeBytes = pyRes.metrics.payloadSizeBytes || (pyRes.sizeBytes - 37);
          engine = 'python';
        } catch (pyErr) {
          console.warn('[HideWorkspace] Python API execution failed, falling back to client-side engine:', pyErr);
          setIsPythonOnline(false);
        }
      }

      // 2. Client-side WebCrypto + HTML5 Canvas Fallback
      if (!stegoPngDataUrl || !metrics) {
        // Authenticated Encryption with AES-256-GCM
        const { ciphertextWithTag, salt, iv } = await encryptMessage(message, password);
        const payload = buildPayload(ciphertextWithTag, salt, iv);
        payloadSizeBytes = payload.length;

        // Load into canvas
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load cover image into canvas memory.'));
          img.src = coverImageFile.dataUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Could not initialize canvas context.');

        ctx.drawImage(img, 0, 0);

        const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const stegoImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Modulate LSBs
        embedPayloadIntoImageData(stegoImageData, payload);
        metrics = calculateImageMetrics(originalImageData, stegoImageData, payload.length);

        ctx.putImageData(stegoImageData, 0, 0);
        stegoPngDataUrl = canvas.toDataURL('image/png');
        engine = 'client';
      }

      const outFilename = `secretpixel_encoded.png`;
      const durationMs = Math.round(performance.now() - startTime);
      setLastEngineUsed(engine);

      setStegoResult({
        dataUrl: stegoPngDataUrl,
        filename: outFilename,
        sizeBytes: Math.round(stegoPngDataUrl.length * 0.75),
        metrics
      });

      updateWorkspaceStatus({
        stegoImageReady: true,
        processingState: 'idle'
      });

      // Persist non-sensitive operational summary
      recordOperationHistory({
        operation_type: 'encode',
        status: 'success',
        image_width: coverImageFile.width,
        image_height: coverImageFile.height,
        image_format: 'PNG',
        payload_size_bytes: payloadSizeBytes,
        processing_duration_ms: durationMs
      }).catch(() => {});

      const engineLabel = engine === 'python' ? 'Python 3.11 / Pillow LSB Engine' : 'Client-Side WebCrypto LSB Engine';
      logActivity({
        type: 'encrypt',
        title: `Message Encrypted (${engine === 'python' ? 'Python' : 'Client'})`,
        detail: `${engineLabel}: AES-256-GCM + 128b tag (${metrics.modifiedPixels} pixels modified, PSNR: ${metrics.psnr} dB)`,
        status: 'success'
      });

      showToast(`Stego-image generated with ${engineLabel}!`, 'success');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred during encryption.';
      setError(errMsg);

      recordOperationHistory({
        operation_type: 'encode',
        status: 'failed',
        image_width: coverImageFile?.width,
        image_height: coverImageFile?.height,
        image_format: 'PNG'
      }).catch(() => {});

      logActivity({
        type: 'error',
        title: 'Embedding Failed',
        detail: errMsg,
        status: 'error'
      });
      showToast(errMsg, 'error');
    } finally {
      setIsProcessing(false);
      updateWorkspaceStatus({ processingState: 'idle' });
    }
  };

  const handleDownload = () => {
    if (!stegoResult) return;
    const link = document.createElement('a');
    link.href = stegoResult.dataUrl;
    link.download = stegoResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logActivity({
      type: 'download',
      title: 'Lossless Stego-PNG Downloaded',
      detail: `${stegoResult.filename} (${(stegoResult.sizeBytes / 1024).toFixed(1)} KB)`,
      status: 'success'
    });
    showToast('Downloaded lossless stego-image PNG', 'success');
  };

  const handleReset = () => {
    setMessage('');
    setPassword('');
    setConfirmPassword('');
    setStegoResult(null);
    setError(null);
    updateWorkspaceStatus({
      estimatedPayloadBytes: 0,
      payloadPrepared: false,
      stegoImageReady: false
    });
    showToast('Hide workspace reset', 'info');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 border border-violet-200">
              <Lock className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Hide Message
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Encrypt confidential text with authenticated AES-256-GCM and imperceptibly weave ciphertext into cover image pixels.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono bg-violet-50 border border-violet-200 text-violet-700 px-3 py-1 rounded-xl font-semibold flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isPythonOnline ? 'bg-emerald-500 shadow-xs' : 'bg-amber-400'}`} />
            {isPythonOnline ? 'Python 3.11 / Pillow LSB' : 'WebCrypto Client Fallback'}
          </span>
          <span className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-xl">
            SPXL v1 · AES-GCM
          </span>
        </div>
      </div>

      {/* 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3 Steps Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: Secret Message */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor={messageInputId}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-violet-700 text-[11px] font-mono border border-violet-200 font-bold">
                  1
                </span>
                <span>Secret Message</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowMessage(!showMessage)}
                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                >
                  {showMessage ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showMessage ? 'Mask' : 'Reveal'}</span>
                </button>
                {message.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMessage('')}
                    className="text-xs text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              id={messageInputId}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type or paste the confidential text you wish to hide..."
              className={`w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all ${
                !showMessage && message.length > 0 ? 'font-mono' : ''
              }`}
            />

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>{message.length} characters</span>
              <span className="text-violet-700 font-semibold">~{estimatedPayloadBytes} bytes total payload (inc. 53B cryptographic header)</span>
            </div>
          </div>

          {/* Step 2: Encryption Passphrase */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor={passwordInputId}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-violet-700 text-[11px] font-mono border border-violet-200 font-bold">
                  2
                </span>
                <span>Encryption Passphrase</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">PBKDF2 100,000 Rounds</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Passphrase Input */}
              <div className="relative">
                <input
                  id={passwordInputId}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passphrase"
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

              {/* Confirm Passphrase Input */}
              <div className="relative">
                <input
                  id={confirmPasswordInputId}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm passphrase"
                  className={`w-full rounded-xl border bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none pr-10 ${
                    confirmPassword.length > 0 && !passwordsMatch
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Validation & Strength Feedback */}
            <div className="mt-3 space-y-2">
              {confirmPassword.length > 0 && (
                <div className="text-[11px] font-mono flex items-center gap-1.5">
                  {passwordsMatch ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Passphrases match
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1 font-semibold">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Passphrases do not match
                    </span>
                  )}
                </div>
              )}

              {password.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Passphrase Entropy:</span>
                    <span
                      className={`font-semibold ${
                        passwordStrength.label === 'Strong'
                          ? 'text-emerald-600'
                          : passwordStrength.label === 'Good'
                          ? 'text-violet-700'
                          : passwordStrength.label === 'Fair'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.score >= 4
                          ? 'w-full bg-emerald-500'
                          : passwordStrength.score === 3
                          ? 'w-3/4 bg-violet-600'
                          : passwordStrength.score === 2
                          ? 'w-1/2 bg-amber-500'
                          : 'w-1/4 bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Cover Image Selection */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-violet-700 text-[11px] font-mono border border-violet-200 font-bold">
                  3
                </span>
                <span>Select Cover Image</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Lossless PNG Output</span>
            </div>

            {/* Preset Enclaves */}
            <div>
              <div className="text-xs text-slate-500 font-medium mb-2">Preset High-Capacity Enclaves:</div>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_IMAGES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => loadPresetImage(preset.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      coverImageFile?.isPreset && coverImageFile.name.includes(preset.name)
                        ? 'border-violet-500 bg-violet-50 text-violet-900 font-semibold'
                        : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:border-violet-300 hover:bg-violet-50/20'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {preset.width}×{preset.height}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reusable Image Uploader */}
            <ImageUploader
              label="Custom Cover Image Upload"
              helperText="Drag & drop any PNG, JPEG, or WebP image. Raster will be verified in browser memory."
              value={coverImageFile}
              onChange={handleImageChange}
              onError={(err) => {
                setError(err);
                showToast(err, 'error');
              }}
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleEncryptAndHide}
              disabled={isProcessing || isOverCapacity}
              className="flex-1 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Processing AES-256 Encryption &amp; Pixel LSB Embedding...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Encrypt &amp; Hide Message</span>
                </>
              )}
            </button>

            {(message || stegoResult || password) && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-3.5 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Reset Workspace"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Capacity Monitor & Generated Stego Output (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Capacity Monitor */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-violet-700 text-[11px] font-mono border border-violet-200 font-bold">
                  4
                </span>
                <span>LSB Capacity Monitor</span>
              </span>
              <span className="text-[11px] font-mono text-violet-700 font-semibold">3 bits / px (RGB)</span>
            </div>

            {capacity ? (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <div className="text-slate-500 text-[11px]">Total Pixels:</div>
                    <div className="text-slate-900 font-mono font-bold mt-0.5">
                      {capacity.totalPixels.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <div className="text-slate-500 text-[11px]">Usable Payload:</div>
                    <div className="text-slate-900 font-mono font-bold mt-0.5">
                      {capacity.usablePayloadBytes.toLocaleString()} Bytes
                    </div>
                  </div>
                </div>

                {/* Real-time Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Capacity Utilization:</span>
                    <span
                      className={
                        isOverCapacity
                          ? 'text-rose-600 font-bold'
                          : capacityUsedPercent > 75
                          ? 'text-amber-600 font-bold'
                          : 'text-violet-700 font-bold'
                      }
                    >
                      {estimatedPayloadBytes} / {capacity.usablePayloadBytes} B ({capacityUsedPercent}%)
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOverCapacity
                          ? 'w-full bg-rose-500'
                          : capacityUsedPercent > 80
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-violet-600 to-sky-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, capacityUsedPercent))}%` }}
                    />
                  </div>

                  {isOverCapacity && (
                    <div className="text-[11px] text-rose-600 font-medium pt-1 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Exceeds capacity by {(estimatedPayloadBytes - capacity.usablePayloadBytes).toLocaleString()} Bytes.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-4">
                Select cover image to evaluate capacity.
              </div>
            )}
          </div>

          {/* Stego Result Card or Cover Preview */}
          {stegoResult && coverImageFile ? (
            <div className="space-y-4">
              {/* Quality Metrics */}
              <div className="rounded-2xl border border-emerald-300 bg-white p-5 shadow-sm relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Stego-Image Generated</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-semibold">
                    Lossless PNG Output
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <div className="text-slate-500 text-[10px]">Peak SNR (PSNR):</div>
                    <div className="text-violet-700 font-mono font-bold text-sm">
                      {stegoResult.metrics.psnr} dB
                    </div>
                    <div className="text-[10px] text-slate-500">&gt;40 dB is humanly imperceptible</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <div className="text-slate-500 text-[10px]">Modified Pixels:</div>
                    <div className="text-emerald-700 font-mono font-bold text-sm">
                      {stegoResult.metrics.modifiedPixels.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500">Only bit 0 adjusted</div>
                  </div>
                </div>

                {/* One-click PNG Download Button */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3 text-xs font-semibold shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Encoded Image as PNG ({stegoResult.filename})</span>
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    ⚠️ Note: PNG format is strictly required. Lossy JPEG compression strips LSB carrier bits.
                  </p>

                  {onTransferToExtract && (
                    <button
                      type="button"
                      onClick={() => onTransferToExtract(stegoResult.dataUrl, stegoResult.filename)}
                      className="w-full rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 text-sky-600" />
                      <span>Send to Extract Console for Decryption</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Live Interactive Original vs Stego Comparison Viewer */}
              <ImageComparisonViewer
                originalDataUrl={coverImageFile.dataUrl}
                stegoDataUrl={stegoResult.dataUrl}
                originalDimensions={{ width: coverImageFile.width, height: coverImageFile.height }}
              />
            </div>
          ) : coverImageFile ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
                <span className="font-bold text-slate-800">Cover Image Preview</span>
                <span className="font-mono text-violet-700 font-semibold">{coverImageFile.width}×{coverImageFile.height}px</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                <img
                  src={coverImageFile.dataUrl}
                  alt="Cover preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                Ready for LSB embedding. Only bit 0 of RGB color channels will be modulated when you click Encrypt &amp; Hide.
              </p>
            </div>
          ) : null}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
