import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-6 mt-auto">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 px-4 mx-auto max-w-5xl">
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          ScriptoAI - Cloud Code Analysis
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>v1.0.0</span>
          <a
            href="https://n8n.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            n8n Docs
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
