import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import DemoDashboard from "@/pages/demo-dashboard";
import ManageConnections from "@/pages/manage-connections";
import Transactions from "@/pages/transactions";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import ConnectBank from "@/pages/connect-bank";
import VerifyMagicLink from "@/pages/verify-magic-link";
import ResetPassword from "@/pages/reset-password";
import ProfileSetup from "@/pages/profile-setup";
import Settings from "@/pages/settings";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    window.location.href = "/auth";
    return <Auth />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/demo" component={DemoDashboard} />
      <Route path="/auth" component={Auth} />
      <Route path="/verify-magic-link" component={VerifyMagicLink} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/profile-setup" component={ProfileSetup} />
      <Route path="/" component={() => {
        const token = localStorage.getItem("token");
        if (!token) {
          return <Auth />;
        }
        return <Dashboard />;
      }} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/manage-connections" component={() => <ProtectedRoute component={ManageConnections} />} />
      <Route path="/connect-bank" component={() => <ProtectedRoute component={ConnectBank} />} />
      <Route path="/transactions" component={() => <ProtectedRoute component={Transactions} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
