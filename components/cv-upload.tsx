"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadCandidates, type UploadState } from "@/lib/actions/candidates";

const MAX_FILES = 10;

export function CvUpload({ jobOpeningId }: { jobOpeningId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [clientError, setClientError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const boundAction = uploadCandidates.bind(null, jobOpeningId);
  const [state, formAction, pending] = useActionState<UploadState, FormData>(boundAction, null);

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const incoming = Array.from(selected).filter((f) => f.type === "application/pdf");

    if (incoming.length !== selected.length) {
      setClientError("Only PDF files are accepted.");
    } else {
      setClientError(null);
    }

    if (incoming.length > MAX_FILES) {
      setClientError(`Max ${MAX_FILES} files per upload — only the first ${MAX_FILES} were kept.`);
    }

    setFiles(incoming.slice(0, MAX_FILES));
  }

  return (
    <form
      action={(formData) => {
        files.forEach((f) => formData.append("files", f));
        formAction(formData);
      }}
      className="space-y-3"
    >
      <div
        className="cursor-pointer rounded-2xl border-2 border-dashed border-primary/40 bg-secondary/50 p-8 text-center transition-colors hover:border-primary hover:bg-secondary"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm font-medium">Drop CV PDFs here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">PDF only · max {MAX_FILES} files per upload</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {clientError && <p className="text-sm text-destructive">{clientError}</p>}
      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
      {state && "success" in state && (
        <p className="text-sm text-primary">Uploaded — queued for scoring.</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
            {files.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>
          <Button type="submit" disabled={pending} className="rounded-full px-5">
            {pending ? "Uploading..." : "Upload and screen"}
          </Button>
        </div>
      )}
    </form>
  );
}
