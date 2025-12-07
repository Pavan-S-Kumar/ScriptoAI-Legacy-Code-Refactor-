import { Code2, Activity } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  apiStatus?: "online" | "offline" | "checking";
}

export function Header({ apiStatus = "checking" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Code2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ScriptoAI</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Cloud-first code analysis demo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className={`h-3.5 w-3.5 ${
              apiStatus === "online" 
                ? "text-chart-2" 
                : apiStatus === "offline" 
                ? "text-destructive" 
                : "text-muted-foreground"
            }`} />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              API {apiStatus === "online" ? "Online" : apiStatus === "offline" ? "Offline" : "..."}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
