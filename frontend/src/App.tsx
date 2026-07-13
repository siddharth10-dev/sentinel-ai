import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Shared/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { IncidentListView } from './components/IncidentTable/IncidentListView';
import { IncidentDetailsView } from './components/IncidentDetails/IncidentDetailsView';
import { AnalyticsView } from './pages/AnalyticsView';
import { SecurityPostureView } from './pages/SecurityPostureView';
import { LogStreamView } from './pages/LogStreamView';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#090D16] flex flex-col font-sans antialiased text-slate-300">
          {/* Header shared navbar */}
          <Header />

          {/* Router Content Container */}
          <div className="flex-grow flex">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/incidents" element={<IncidentListView />} />
              <Route path="/incidents/:id" element={<IncidentDetailsView />} />
              <Route path="/analytics" element={<AnalyticsView />} />
              <Route path="/security" element={<SecurityPostureView />} />
              <Route path="/logs" element={<LogStreamView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
