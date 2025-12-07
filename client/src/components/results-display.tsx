import { useState } from "react";
import {
  FileCode,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Download,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { AnalysisResult } from "@shared/schema";

interface ResultsDisplayProps {
  results: AnalysisResult;
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [issuesOpen, setIssuesOpen] = useState(true);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const summary = results.summary;
  const issues = results.issues || [];
  const refactoredFiles = results.refactoredFiles || [];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "major":
        return <AlertTriangle className="h-4 w-4 text-chart-3" />;
      case "minor":
        return <Info className="h-4 w-4 text-chart-1" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge variant="destructive" className="text-xs">
            Critical
          </Badge>
        );
      case "major":
        return (
          <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 text-xs">
            Major
          </Badge>
        );
      case "minor":
        return (
          <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20 text-xs">
            Minor
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-${results.request_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    window.open(`/api/download/${results.request_id}/markdown`, '_blank');
  };

  const handleDownloadRefactored = () => {
    window.open(`/api/download/${results.request_id}/refactored`, '_blank');
  };

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                  <FileCode className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{summary.total_files_analyzed}</p>
                  <p className="text-sm text-muted-foreground">Files Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{summary.issues_count.critical}</p>
                  <p className="text-sm text-muted-foreground">Critical Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                  <AlertTriangle className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{summary.issues_count.major}</p>
                  <p className="text-sm text-muted-foreground">Major Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                  <Info className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{summary.issues_count.minor}</p>
                  <p className="text-sm text-muted-foreground">Minor Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Download Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadMarkdown}
              data-testid="button-download-markdown"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Markdown Report
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadJson}
              data-testid="button-download-json-top"
            >
              <Download className="h-4 w-4 mr-2" />
              Download JSON Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && summary.languages.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Languages Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="text-sm capitalize">
                  {lang}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {issues.length > 0 && (
        <Collapsible open={issuesOpen} onOpenChange={setIssuesOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  Issues Found
                  <Badge variant="secondary" className="ml-2">
                    {issues.length}
                  </Badge>
                </CardTitle>
                {issuesOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {issues.map((issue, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg space-y-2"
                        data-testid={`issue-item-${index}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(issue.severity)}
                            <span className="font-medium text-sm">
                              {issue.message}
                            </span>
                          </div>
                          {getSeverityBadge(issue.severity)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-mono">{issue.file}:{issue.line}</span>
                          {issue.rule && (
                            <Badge variant="outline" className="text-xs">
                              {issue.rule}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      <Card className="border-chart-2/50 bg-gradient-to-br from-chart-2/5 to-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-chart-2" />
            Your Refactored Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-chart-2" />
              <div>
                <p className="font-medium">
                  {refactoredFiles.length} {refactoredFiles.length === 1 ? 'file' : 'files'} refactored
                </p>
                <p className="text-sm text-muted-foreground">
                  AI-powered code improvements applied to all analyzed files
                </p>
              </div>
            </div>
            
            {refactoredFiles.length > 0 ? (
              <Button
                onClick={handleDownloadRefactored}
                className="w-full bg-chart-2 hover:bg-chart-2/90 text-white"
                size="lg"
                data-testid="button-download-refactored"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Refactored Code (.zip)
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No refactored files available for this analysis.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-lg">Raw JSON Results</CardTitle>
              <div className="flex items-center gap-2">
                {jsonOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="flex justify-end gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  data-testid="button-copy-json"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadJson}
                  data-testid="button-download-json"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              <ScrollArea className="h-[400px]">
                <pre className="p-4 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
