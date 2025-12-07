import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { UploadForm } from "@/components/upload-form";
import { StatusDisplay } from "@/components/status-display";
import { ResultsDisplay } from "@/components/results-display";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisJob, AnalysisResult } from "@shared/schema";

type ViewState = "upload" | "status" | "results";

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>("upload");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { data: apiHealth } = useQuery<{ status: string }>({
    queryKey: ["/api/health"],
    refetchInterval: 30000,
    retry: false,
  });

  const apiStatus = apiHealth?.status === "ok" ? "online" : apiHealth === undefined ? "checking" : "offline";

  const { data: currentJob, refetch: refetchJob } = useQuery<AnalysisJob>({
    queryKey: ["/api/status", currentJobId || ""],
    enabled: !!currentJobId,
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to start analysis" }));
        throw new Error(error.message || "Failed to start analysis");
      }
      return response.json() as Promise<{ request_id: string }>;
    },
    onSuccess: (data) => {
      setCurrentJobId(data.request_id);
      setViewState("status");
      toast({
        title: "Analysis Started",
        description: "Your code is being analyzed. This may take a few moments.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start analysis",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (currentJob && (currentJob.status === "pending" || currentJob.status === "processing")) {
      pollingRef.current = setInterval(() => {
        refetchJob();
      }, 2000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }

    if (currentJob?.status === "completed") {
      setViewState("results");
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }

    if (currentJob?.status === "failed") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      toast({
        title: "Analysis Failed",
        description: "There was an error processing your code. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentJob, refetchJob, toast]);

  const handleNewAnalysis = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setCurrentJobId(null);
    setViewState("upload");
  };

  const handleSubmit = async (formData: FormData) => {
    submitMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header apiStatus={apiStatus} />
      
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8">
        {viewState === "upload" && (
          <div className="space-y-8">
            <UploadForm onSubmit={handleSubmit} isLoading={submitMutation.isPending} />
            {!currentJob && <EmptyState onStartAnalysis={() => {}} />}
          </div>
        )}

        {viewState === "status" && currentJob && (
          <div className="space-y-6">
            <StatusDisplay job={currentJob} onNewAnalysis={handleNewAnalysis} />
          </div>
        )}

        {viewState === "results" && currentJob?.results && (
          <div className="space-y-6">
            <StatusDisplay job={currentJob} onNewAnalysis={handleNewAnalysis} />
            <ResultsDisplay results={currentJob.results as AnalysisResult} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
