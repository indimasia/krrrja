"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const MAX_FILES = 10;

// Shell dropzone. Super admins have no org/job scope in the schema, so there is
// no wired upload target yet — this collects files client-side only.
export function UploadShell() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const pdfs = Array.from(selected).filter((f) => f.type === "application/pdf");
    setError(pdfs.length !== selected.length ? "Only PDF files are accepted." : null);
    setFiles(pdfs.slice(0, MAX_FILES));
  }

  return (
    <div className="space-y-3">
      <div
        className="cursor-pointer rounded-2xl border-2 border-dashed border-primary/40 bg-secondary/50 p-10 text-center transition-colors hover:border-primary hover:bg-secondary"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm font-medium">Drop CV PDFs here or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">PDF only · max {MAX_FILES} files per upload</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-muted-foreground">
            {files.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>
          <Button type="button" disabled className="rounded-full px-5">
            Upload (shell — no target wired)
          </Button>
        </div>
      )}
    </div>
  );
}
