import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadShell } from "./upload-shell";

export default function ProResumeUploadPage() {
  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Resume Upload</h1>
        <p className="mt-1 text-sm text-muted-foreground">Batch upload CV PDFs for screening.</p>
      </div>

      <Card className="mx-auto max-w-2xl rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Upload resumes</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadShell />
        </CardContent>
      </Card>
    </div>
  );
}
