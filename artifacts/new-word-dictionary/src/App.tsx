import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { Shell } from '@/components/shell';
import Home from '@/pages/home';
import About from '@/pages/about';
import WordDetail from '@/pages/word-detail';
import AdminDashboard from '@/pages/admin-dashboard';
import AdminNewWord from '@/pages/admin-new';
import AdminEditWord from '@/pages/admin-edit';

// Policies
import EditorialPolicy from '@/pages/policies/editorial';
import SourcesPolicy from '@/pages/policies/sources';
import NamingPolicy from '@/pages/policies/naming';
import CorrectionsPolicy from '@/pages/policies/corrections';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/categories/:category" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/words/:slug" component={WordDetail} />
          
          <Route path="/policies/editorial" component={EditorialPolicy} />
          <Route path="/policies/sources" component={SourcesPolicy} />
          <Route path="/policies/naming" component={NamingPolicy} />
          <Route path="/policies/corrections" component={CorrectionsPolicy} />

          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/new" component={AdminNewWord} />
          <Route path="/admin/words/:id" component={AdminEditWord} />
          
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
