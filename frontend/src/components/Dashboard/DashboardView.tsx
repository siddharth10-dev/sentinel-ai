import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Clock, 
  Layers, 
  ArrowUpRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LodgeIncidentModal } from './LodgeIncidentModal';

interface Incident {
  id: number;
  service: string;
  message: string;
  severity: string;
  classification: {
    category: string;
    priority: string;
    summary: string;
  };
  status: string;
  created_at: string;
}

const getRelativeTime = (isoString: string) => {
  if (!isoString) return 'unknown';
  const past = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return past.toLocaleDateString();
};

export const DashboardView: React.FC = () => {
  const [isLodgeOpen, setIsLodgeOpen] = useState(false);
  const { data: incidents = [], isLoading, error } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:8000/incidents');
      return res.data;
    },
    refetchInterval: 5000, // Poll every 5s for dashboard real-time feel
  });

  // Calculate stats
  const totalIncidents = incidents.length;
  const pendingCount = incidents.filter(i => i.status === 'pending_approval').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved' || i.status === 'approved').length;
  const resolutionRate = totalIncidents > 0 
    ? ((resolvedCount / totalIncidents) * 100).toFixed(1) 
    : '0';

  // Group incidents by Service for the chart
  const serviceGroups = incidents.reduce((acc: Record<string, number>, curr) => {
    const srv = curr.service || 'other';
    acc[srv] = (acc[srv] || 0) + 1;
    return acc;
  }, {});

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const chartData = Object.keys(serviceGroups).map((service, index) => ({
    name: service,
    value: serviceGroups[service],
    color: COLORS[index % COLORS.length]
  }));

  // Fallback pie data if no incidents
  const pieData = chartData.length > 0 ? chartData : [{ name: 'No alerts', value: 1, color: '#1E293B' }];

  if (isLoading) {
    return (
      <div className="flex-1 bg-darkBg p-8 flex flex-col justify-center items-center text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading SRE Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-darkBg p-8 flex flex-col justify-center items-center text-rose-500">
        <AlertTriangle className="w-8 h-8 mb-4 animate-bounce" />
        <p className="text-sm font-semibold">Failed to fetch backend data.</p>
        <p className="text-xs text-slate-500 mt-2">Is the Sentinel backend running at http://localhost:8000?</p>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-darkBg p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-8 select-none">
      {/* Page Title & Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time intelligence and threat orchestration.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsLodgeOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white text-sm font-semibold rounded flex items-center space-x-2 transition-colors shadow-lg shadow-rose-600/10"
          >
            <span>+ Lodge Incident</span>
          </button>
          <Link 
            to="/incidents" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded flex items-center space-x-2 transition-colors shadow-lg shadow-blue-600/10"
          >
            <span>Incident Command Center</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Grid: 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* TOTAL INCIDENTS */}
        <div className="bg-darkCard/60 border border-darkBorder rounded-lg p-5 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Total Incidents</span>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-white font-mono">{totalIncidents}</span>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/30">
              +4% ↗
            </span>
          </div>
        </div>

        {/* PENDING APPROVAL */}
        <div className="bg-darkCard/60 border border-darkBorder rounded-lg p-5 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Pending Approval</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pendingCount > 0 ? 'bg-amber-500/15 text-amber-400 animate-pulse' : 'bg-slate-800/40 text-slate-500'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-white font-mono">{pendingCount}</span>
            <span className="text-xs text-slate-500">Actions Required</span>
          </div>
        </div>

        {/* RESOLUTION RATE */}
        <div className="bg-darkCard/60 border border-darkBorder rounded-lg p-5 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Resolution Rate</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-white font-mono">{resolutionRate}%</span>
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Optimal</span>
          </div>
        </div>

        {/* THREAT SCORE */}
        <div className="bg-darkCard/60 border border-darkBorder rounded-lg p-5 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Threat Score</span>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-white">Low</span>
            <span className="text-xs font-medium text-slate-500">
              -2% ↘
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent Activity vs Right Panel Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Recent Activity */}
        <div className="lg:col-span-2 bg-darkCard/40 border border-darkBorder rounded-lg p-6 flex flex-col backdrop-blur-md">
          <div className="flex items-center justify-between pb-6 border-b border-darkBorder/40">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
              <p className="text-xs text-slate-500 mt-1">System events and triggered alerts across all clusters.</p>
            </div>
            <Link to="/incidents" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition-colors">
              <span>View All Activity</span>
              <span>→</span>
            </Link>
          </div>

          <div className="mt-6 flex-1 space-y-4">
            {incidents.slice(0, 5).map((incident) => {
              const isPending = incident.status === 'pending_approval';
              const isCritical = incident.severity === 'critical' || incident.severity === 'error';
              
              return (
                <Link
                  to={`/incidents/${incident.id}`}
                  key={incident.id}
                  className="flex items-start justify-between p-4 rounded-lg bg-slate-900/30 border border-darkBorder hover:border-slate-700/60 hover:bg-slate-900/60 transition-all group"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`mt-1 w-8 h-8 rounded flex items-center justify-center border ${
                      isCritical 
                        ? 'bg-rose-950/20 border-rose-800/40 text-rose-500' 
                        : isPending 
                        ? 'bg-amber-950/20 border-amber-800/40 text-amber-500 animate-pulse'
                        : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-500'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {incident.classification?.summary || incident.message}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        {incident.service} &bull; {incident.classification?.category || 'Automation System'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className="text-xs text-slate-500">{getRelativeTime(incident.created_at)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider ${
                      isCritical
                        ? 'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                        : isPending
                        ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                        : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                    }`}>
                      {incident.severity}
                    </span>
                  </div>
                </Link>
              );
            })}
            
            {incidents.length === 0 && (
              <div className="h-48 flex flex-col justify-center items-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs">All clear. No active alerts recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Pie Distribution Chart & Active Alerts */}
        <div className="space-y-8">
          
          {/* Incident Distribution Donut */}
          <div className="bg-darkCard/40 border border-darkBorder rounded-lg p-6 flex flex-col backdrop-blur-md">
            <h2 className="text-lg font-bold text-white pb-4 border-b border-darkBorder/40">Incident Distribution</h2>
            <div className="h-60 mt-4 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Donut Center Label */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-white font-mono">{totalIncidents}</span>
                <span className="text-[10px] text-slate-500 tracking-widest uppercase font-semibold mt-1">Total Volume</span>
              </div>
            </div>
            
            {/* Chart Legend */}
            <div className="mt-4 space-y-2">
              {chartData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-slate-400 font-medium font-mono">{entry.name}</span>
                  </div>
                  <span className="text-white font-bold font-mono">
                    {((entry.value / totalIncidents) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Pending Alerts */}
          <div className="bg-darkCard/40 border border-darkBorder rounded-lg p-6 flex flex-col backdrop-blur-md">
            <h2 className="text-lg font-bold text-white pb-4 border-b border-darkBorder/40">Active Alerts</h2>
            <div className="mt-4 space-y-4">
              {incidents.filter(i => i.status === 'pending_approval').slice(0, 2).map((alert) => (
                <Link
                  to={`/incidents/${alert.id}`}
                  key={alert.id}
                  className="block p-4 rounded-lg bg-rose-950/10 border border-rose-900/30 hover:border-rose-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/30 uppercase tracking-wider">
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-500">{getRelativeTime(alert.created_at)}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-2 leading-tight">
                    {alert.message}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {alert.service}
                  </p>
                </Link>
              ))}

              {incidents.filter(i => i.status === 'pending_approval').length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No active items waiting for approval.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
      <LodgeIncidentModal isOpen={isLodgeOpen} onClose={() => setIsLodgeOpen(false)} />
    </main>
  );
};
