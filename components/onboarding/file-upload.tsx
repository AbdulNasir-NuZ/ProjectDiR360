"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type FileUploadProps = {
  onFileChange: (file: File | null) => void;
  file: File | null;
};

export function FileUpload({ onFileChange, file }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = (selected: File | null) => {
    if (!selected) return;
    onFileChange(selected);
    setUploading(true);
    setTimeout(() => setUploading(false), 700);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,image/*"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      <div
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`rounded-md border border-dashed p-6 text-center transition-colors ${
          dragging ? "border-primary bg-primary/10" : "border-border bg-card"
        }`}
      >
        <Upload className="mx-auto mb-3 size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Drag & drop PDF/Image here</p>
        <Button variant="ghost" className="mt-3" onClick={openPicker} type="button">
          Choose file
        </Button>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Uploading...
        </div>
      )}

      {file && (
        <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
          <p className="truncate text-sm">{file.name}</p>
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => onFileChange(null)}>
            <X className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
