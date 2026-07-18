"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadCandidates } from "@/lib/actions/candidates";

export function CvUpload({
  jobOpeningId,
  onSuccess,
}: {
  jobOpeningId: string;
  onSuccess?: (fileCount: number) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const incoming = Array.from(selected).filter((f) => f.type === "application/pdf");
    setError(incoming.length !== selected.length ? "Only PDF files are accepted." : null);
    setFiles(incoming);
  }

  // The action is called directly (not via useActionState) so the success
  // branch can hand control back to the caller — the dialog closes and toasts
  // from here, without an effect watching action state.
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const count = files.length;
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    startTransition(async () => {
      const result = await uploadCandidates(jobOpeningId, null, formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      setFiles([]);
      setError(null);
      onSuccess?.(count);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div
        className="cursor-pointer rounded-2xl border-2 border-dashed border-primary-emphasis bg-primary-surface p-8 text-center transition-colors duration-200 hover:border-primary-ink hover:bg-primary-fill"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm font-medium">Drop CV PDFs here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">PDF only · no file limit per upload</p>
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
