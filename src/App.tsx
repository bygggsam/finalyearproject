
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { usePerformanceInit } from "@/hooks/usePerformanceInit";
import { Suspense, lazy } from "react";
import { OptimizedLoader } from "@/components/ui/optimized-loader";
import Index from "./pages/Index";

// Lazy load pages for better performance
const NotFound = lazy(() => import("./pages/NotFound"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const HandwrittenPage = lazy(() => import("./pages/HandwrittenPage"));
const FormatterPage = lazy(() => import("./pages/FormatterPage"));
const StagesPage = lazy(() => import("./pages/StagesPage"));
const EvaluationPage = lazy(() => import("./pages/EvaluationPage"));
const PatientsPage = lazy(() => import("./pages/PatientsPage"));
const VerificationPage = lazy(() => import("./pages/VerificationPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const MetricsPage = lazy(() => import("./pages/MetricsPage"));

// Highly optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - longer stale time
      gcTime: 15 * 60 * 1000, // 15 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false, // Disable automatic refetch
      networkMode: 'always' // Better offline support
    },
    mutations: {
      retry: 1,
      networkMode: 'always'
    }
  }
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <OptimizedLoader size="lg" text="Loading page..." />
  </div>
);

function App() {
  // Initialize performance optimizations
  usePerformanceInit();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/handwritten" element={<HandwrittenPage />} />
              <Route path="/formatter" element={<FormatterPage />} />
              <Route path="/stages" element={<StagesPage />} />
              <Route path="/evaluation" element={<EvaluationPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/verification" element={<VerificationPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
