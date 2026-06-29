import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BabyProvider, useBaby } from "@/hooks/useBaby";
import { I18nProvider } from "@/lib/i18n";
import AppLayout from "./components/AppLayout";
import Today from "./pages/Today";

// Auth & onboarding are off the main flow, calendar pulls in react-day-picker,
// family pulls in co-parent forms, weight pulls in recharts — lazy-load them
// to shrink the initial bundle.
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CalendarView = lazy(() => import("./pages/CalendarView"));
const Family = lazy(() => import("./pages/Family"));
const Weight = lazy(() => import("./pages/Weight"));
const Supplements = lazy(() => import("./pages/Supplements"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-soft">…</div>
);

const Protected = ({ children }: { children: JSX.Element }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-soft">…</div>;
  if (!session) return <Navigate to="/auth" replace />;
  return children;
};

const RequireBaby = ({ children }: { children: JSX.Element }) => {
  const { babies, loading } = useBaby();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-soft">…</div>;
  if (babies.length === 0) return <Navigate to="/onboarding" replace />;
  return children;
};

const Routed = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/onboarding"
        element={
          <Protected>
            <Onboarding />
          </Protected>
        }
      />
      <Route
        element={
          <Protected>
            <RequireBaby>
              <AppLayout />
            </RequireBaby>
          </Protected>
        }
      >
        <Route path="/" element={<Today />} />
        {/* "Lista" merged into the home view; keep the old path working. */}
        <Route path="/list" element={<Navigate to="/" replace />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/weight" element={<Weight />} />
        <Route path="/gocce" element={<Supplements />} />
        <Route path="/family" element={<Family />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <BabyProvider>
              <Routed />
            </BabyProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
