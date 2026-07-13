import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { AlertOctagon, TrendingUp, Cpu, Activity } from 'lucide-react';

interface Incident {
  id: number;
  service: string;
  severity: string;
  status: string;
  created_at: string;
}

export const AnalyticsView: React.FC = () => {
  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:8000/incidents');
      return res.data;
    }
  });

  // Calculate statistics
  const total = incidents.length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' || i.severity === 'error').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved' || i.status === 'approved').length;
  const pendingCount = incidents.filter(i => i.status === 'pending_approval').length;

  // Process data for Incidents per Service
  const serviceCounts = incidents.reduce((acc: Record<string, number>, curr) => {
    acc[curr.service] = (acc[curr.service] || 0) + 1;
    return acc;
  }, {});

  const serviceData = Object.keys(serviceCounts).map(key => ({
    name: key,
    incidents: serviceCounts[key]
  }));

  // Process data for incidents over time (simulated by date formatting or IDs)
  const timeData = incidents.slice().reverse().map((inc, index) => {
    const date = new Date(inc.created_at);
    return {
      name: `${date.getHours()}:${date.getMinutes()}`,
      count: index + 1
    };
  });

  if (isLoading) {
    return (
      <div className="flex-grow bg-darkBg p-8 flex flex-col justify-center items-center text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Computing SRE analytics...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-darkBg p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-8 select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">SRE Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Incident distributions, system load indicators, and automated response trends.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-darkCard/50 border border-darkBorder rounded-lg p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Volume</span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{total}</div>
          </div>
          <AlertOctagon className="w-8 h-8 text-blue-500/80" />
        </div>

        <div className="bg-darkCard/50 border border-darkBorder rounded-lg p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Critical Severity</span>
            <div className="text-2xl font-bold text-rose-500 mt-1 font-mono">{criticalCount}</div>
          </div>
          <TrendingUp className="w-8 h-8 text-rose-500/80" />
        </div>

        <div className="bg-darkCard/50 border border-darkBorder rounded-lg p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending MTTR</span>
            <div className="text-2xl font-bold text-amber-500 mt-1 font-mono">{pendingCount}</div>
          </div>
          <Activity className="w-8 h-8 text-amber-500/80" />
        </div>

        <div className="bg-darkCard/50 border border-darkBorder rounded-lg p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resolved Cases</span>
            <div className="text-2xl font-bold text-emerald-500 mt-1 font-mono">{resolvedCount}</div>
          </div>
          <Cpu className="w-8 h-8 text-emerald-500/80" />
        </div>
      </div>

      {/* Recharts Area Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Trend Area Chart */}
        <div className="bg-darkCard/40 border border-darkBorder rounded-lg p-6 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white tracking-wide mb-4">Cumulative Incident Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#161D2B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0E131F', borderColor: '#161D2B', color: '#fff' }} />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents per Service Bar Chart */}
        <div className="bg-darkCard/40 border border-darkBorder rounded-lg p-6 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white tracking-wide mb-4">Incidents per Microservice</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#161D2B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0E131F', borderColor: '#161D2B', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="incidents" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </main>
  );
};
