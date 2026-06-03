"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { appToast } from "@/lib/app-toast";
import { readImageFileAsDataUrl } from "@/lib/read-image-file";
import { cn } from "@/lib/utils";

interface ImageDropUploadProps {
  previewUrl?: string;
  onImageChange: (dataUrl: string | undefined) => void;
  emptyHint: string;
  previewAlt: string;
  inputLabel: string;
  imageClassName?: string;
}

export default function ImageDropUpload({
  previewUrl,
  onImageChange,
  emptyHint,
  previewAlt,
  inputLabel,
  imageClassName = "h-full w-full object-cover",
}: ImageDropUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      try {
        const dataUrl = await readImageFileAsDataUrl(file, inputLabel);
        onImageChange(dataUrl);
      } catch (err) {
        appToast.error(
          err instanceof Error ? err.message : "Could not load image."
        );
      }
    },
    [inputLabel, onImageChange]
  );

  const handleFiles = useCallback(
    (files: FileList | null | undefined) => {
      const file = files?.[0];
      if (!file) return;
      void processFile(file);
    },
    [processFile]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={inputLabel}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "cricket-upload-zone",
          isDragging && "cricket-upload-zone--dragover"
        )}
        aria-label={`${inputLabel}. Drag and drop or click to browse.`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={previewAlt}
            className={imageClassName}
          />
        ) : (
          <>
            <ImageIcon className="h-10 w-10 text-[oklch(0.45_0.04_255)]" />
            <span className="text-[oklch(0.55_0.03_255)] text-sm text-center px-4">
              {isDragging ? "Drop image here" : emptyHint}
            </span>
          </>
        )}
      </button>
    </>
  );
}
