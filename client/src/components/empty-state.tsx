import { FileSearch, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onStartAnalysis: () => void;
}

export function EmptyState({ onStartAnalysis }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-6">
        <FileSearch className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No Analysis Results Yet</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Upload a repository ZIP file or paste a GitHub URL to get started with
        your first code analysis.
      </p>
      <Button onClick={onStartAnalysis} data-testid="button-start-analysis">
        Start Your First Analysis
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
