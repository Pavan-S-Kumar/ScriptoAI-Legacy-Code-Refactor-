import { useState, useRef, useCallback } from "react";
import { Upload, Link, FileArchive, Loader2, FolderCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface UploadFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

type InputMode = "file" | "url";
type AnalysisMode = "quick" | "standard" | "deep";

export function UploadForm({ onSubmit, isLoading }: UploadFormProps) {
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("standard");
  const [file, setFile] = useState<File | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".zip")) {
      setFile(droppedFile);
      setInputMode("file");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("analysis_mode", analysisMode);
    
    if (inputMode === "file" && file) {
      formData.append("code_zip", file);
    } else if (inputMode === "url" && repoUrl) {
      formData.append("repo_url", repoUrl);
    } else {
      return;
    }

    await onSubmit(formData);
  };

  const canSubmit = (inputMode === "file" && file) || (inputMode === "url" && repoUrl.trim());

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FolderCode className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Analyze Your Code</CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload a ZIP file or provide a GitHub repository URL
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setInputMode("file")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                inputMode === "file"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-mode-file"
            >
              <FileArchive className="h-4 w-4" />
              Upload ZIP
            </button>
            <button
              type="button"
              onClick={() => setInputMode("url")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                inputMode === "url"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-mode-url"
            >
              <Link className="h-4 w-4" />
              GitHub URL
            </button>
          </div>

          {inputMode === "file" ? (
            <div
              className={`relative min-h-[200px] border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-chart-2 bg-chart-2/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone-file"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-file"
              />
              {file ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chart-2/10">
                    <FileArchive className="h-7 w-7 text-chart-2" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    data-testid="button-remove-file"
                  >
                    Remove file
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      Drop your ZIP file here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="repo-url" className="text-sm font-medium">
                Repository URL
              </Label>
              <Input
                id="repo-url"
                type="url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="h-12"
                data-testid="input-repo-url"
              />
              <p className="text-xs text-muted-foreground">
                Enter a public GitHub repository URL to analyze
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">Analysis Mode</Label>
            <RadioGroup
              value={analysisMode}
              onValueChange={(v) => setAnalysisMode(v as AnalysisMode)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  analysisMode === "quick"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                data-testid="radio-mode-quick"
              >
                <RadioGroupItem value="quick" id="quick" className="mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Quick</p>
                  <p className="text-xs text-muted-foreground">
                    Fast surface-level scan
                  </p>
                </div>
              </label>
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  analysisMode === "standard"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                data-testid="radio-mode-standard"
              >
                <RadioGroupItem value="standard" id="standard" className="mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Standard</p>
                  <p className="text-xs text-muted-foreground">
                    Balanced analysis
                  </p>
                </div>
              </label>
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  analysisMode === "deep"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                data-testid="radio-mode-deep"
              >
                <RadioGroupItem value="deep" id="deep" className="mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Deep</p>
                  <p className="text-xs text-muted-foreground">
                    Comprehensive review
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit || isLoading}
            className="w-full h-12 text-base"
            data-testid="button-submit-analysis"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              <>
                <FolderCode className="h-5 w-5" />
                Start Analysis
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
