import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };
  children: any;

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-6">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-slate-400 mb-8 max-w-md">
            MT-Tech Solutions encountered an unexpected error. Don't worry, your data is safe.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Reload Page
          </Button>
        </div>
      );
    }

    return this.children;
  }
}

export default ErrorBoundary;