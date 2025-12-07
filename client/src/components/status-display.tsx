import { CheckCircle2, Clock, AlertTriangle, Loader2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnalysisJob } from "@shared/schema";

interface StatusDisplayProps {
  job: AnalysisJob;
  onNewAnalysis: () => void;
}

export function StatusDisplay({ job, onNewAnalysis }: StatusDisplayProps) {
  const getStatusIcon = () => {
    switch (job.status) {
      case "pending":
        return <Clock className="h-5 w-5 text-muted-foreground" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-chart-2" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (job.status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {getStatusIcon()}
          </div>
          <div>
            <CardTitle className="text-lg">Analysis Status</CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {job.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <Button
            variant="outline"
            size="sm"
            onClick={onNewAnalysis}
            data-testid="button-new-analysis"
          >
            New Analysis
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Mode</p>
            <p className="font-medium capitalize">{job.analysisMode}</p>
          </div>
          {job.repoUrl && (
            <div className="space-y-1 col-span-2">
              <p className="text-muted-foreground">Repository</p>
              <p className="font-medium font-mono text-xs truncate">
                {job.repoUrl}
              </p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-muted-foreground">Started</p>
            <p className="font-medium">{formatTime(job.createdAt)}</p>
          </div>
          {job.status === "completed" && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Completed</p>
              <p className="font-medium">{formatTime(job.updatedAt)}</p>
            </div>
          )}
        </div>

        {(job.status === "pending" || job.status === "processing") && (
          <div className="mt-6 flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <div>
              <p className="font-medium text-sm">
                {job.status === "pending"
                  ? "Waiting to start..."
                  : "Analyzing your code..."}
              </p>
              <p className="text-xs text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          </div>
        )}

        {job.status === "failed" && (
          <div className="mt-6 flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-sm text-destructive">
                Analysis Failed
              </p>
              <p className="text-xs text-muted-foreground">
                There was an error processing your code. Please try again.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
