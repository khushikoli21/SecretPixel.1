import React, { useRef, useState } from 'react';
import { Upload, FileImage, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export interface UploadedImageData {
  name: string;
  size: number;
  width: number;
  height: number;
  dataUrl: string;
  isPreset?: boolean;
}

interface ImageUploaderProps {
  label: string;
  helperText?: string;
  value: UploadedImageData | null;
  onChange: (image: UploadedImageData | null) => void;
  onError?: (errorMessage: string) => void;
  accept?: string;
  requiredFormatNote?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  helperText = 'PNG, JPEG, WebP supported for encoding (PNG recommended for lossless preservation)',
  value,
  onChange,
  onError,
  accept = 'image/png, image/jpeg, image/webp',
  requiredFormatNote
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      const err = `Invalid file type: "${file.name}". Please upload a valid image file.`;
      if (onError) onError(err);
      return;
    }

    setIsValidating(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        setIsValidating(false);
        onChange({
          name: file.name,
          size: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          dataUrl,
          isPreset: false
        });
      };

      img.onerror = () => {
        setIsValidating(false);
        const err = `Corrupted or unreadable image: "${file.name}". Unable to decode image raster.`;
        if (onError) onError(err);
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      setIsValidating(false);
      const err = `Failed to read file "${file.name}".`;
      if (onError) onError(err);
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span>{label}</span>
        </label>
        {requiredFormatNote && (
          <span className="text-[11px] font-mono text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
            {requiredFormatNote}
          </span>
        )}
      </div>

      {!value ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 select-none ${
            isDragging
              ? 'border-violet-500 bg-violet-50/60 shadow-md shadow-violet-500/10 scale-[1.01]'
              : 'border-slate-300 bg-[#F8FAFC] hover:border-violet-400 hover:bg-violet-50/20'
          }`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100/80 border border-violet-200 text-violet-600 mb-3 shadow-2xs">
            {isValidating ? (
              <RefreshCw className="h-6 w-6 animate-spin text-violet-600" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
          </div>

          <div className="text-sm font-semibold text-slate-900">
            {isValidating ? 'Validating Image Structure...' : 'Drop image file here, or click to browse'}
          </div>

          <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">{helperText}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
          {/* Image Preview Container */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
            <img
              src={value.dataUrl}
              alt="Selected cover preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-800 border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>Verified Valid Raster</span>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="flex items-center justify-between text-xs text-slate-700 bg-[#F8FAFC] p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileImage className="h-4 w-4 text-violet-600 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-slate-900 truncate">{value.name}</div>
                <div className="text-[11px] font-mono text-slate-500">
                  {value.width} × {value.height} px · {(value.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="p-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                title="Remove image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};
