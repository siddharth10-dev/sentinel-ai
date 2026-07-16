import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Search, 
  Cloud, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { LodgeIncidentModal } from '../Dashboard/LodgeIncidentModal';
import { API_BASE_URL } from '../../config';

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

export const IncidentListView: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLodgeOpen, setIsLodgeOpen] = useState(false);
  const itemsPerPage = 5;

  const { data: incidents = [], isLoading, error } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/incidents`);
      return res.data;
    },
    refetchInterval: 5000,
  });

  // Filter & Search Logic
  const filteredIncidents = incidents.filter(inc => {
    const searchMatch = 
      `INC-${inc.id}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.message.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter === 'All' || 
      (statusFilter === 'pending_approval' && inc.status === 'pending_approval') ||
      (statusFilter === 'resolved' && (inc.status === 'resolved' || inc.status === 'approved')) ||
      (statusFilter === 'rejected' && inc.status === 'rejected');

    const severityMatch = severityFilter === 'All' || 
      inc.severity.toLowerCase() === severityFilter.toLowerCase();

    return searchMatch && statusMatch && severityMatch;
  });

  // Pagination Logic
  const totalItems = filteredIncidents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentIncidents = filteredIncidents.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Service', 'Message', 'Severity', 'Status', 'Created At'];
    const rows = filteredIncidents.map(i => [
      `INC-${i.id}`,
      i.service,
      i.message,
      i.severity,
      i.status,
      i.created_at
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kyro_incidents_export.csv`);
    link.click();
  };

  if (isLoading) {
    return (
      <main className="flex-1 bg-[#090D16] p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-8 select-none">
        <div>
          <div className="h-8 bg-slate-900 rounded w-48 animate-pulse mb-2"></div>
          <div className="h-4 bg-slate-900/50 rounded w-64 animate-pulse"></div>
        </div>
        
        {/* Controls skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="h-10 bg-slate-900 rounded w-64 animate-pulse"></div>
            <div className="h-10 bg-slate-900 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-10 bg-slate-900 rounded w-32 animate-pulse"></div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-white/[0.03] px-6 py-4 border-b border-white/[0.08]">
            <div className="h-4 bg-slate-900 rounded w-full animate-pulse"></div>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-900 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-slate-900/50 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 bg-slate-900 rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-darkBg p-8 flex flex-col justify-center items-center text-rose-500">
        <AlertTriangle className="w-8 h-8 mb-4 animate-bounce" />
        <p className="text-sm font-semibold">Failed to fetch backend incidents.</p>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-[#090D16] p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-8 select-none">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Active Incidents</h1>
        <p className="text-sm text-slate-500 mt-1">Monitoring 14 services across 3 regions.</p>
      </div>

      {/* Filters row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar matching Image 2 top right layout */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/60 border border-darkBorder rounded pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-darkBorder rounded px-3 py-2 text-xs text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-darkBorder rounded px-3 py-2 text-xs text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Severity</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">Any Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsLodgeOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-755 text-white text-xs font-bold rounded flex items-center space-x-1.5 transition-colors shadow-lg shadow-rose-600/10"
          >
            <span>+ Lodge Incident</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900/60 border border-darkBorder rounded text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/40 transition-all flex items-center space-x-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Incidents Table Container */}
      <div className="bg-darkCard/30 border border-darkBorder rounded-lg overflow-hidden backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-darkBorder/60 bg-slate-950/20 text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none">
              <th className="py-4 px-6">ID</th>
              <th className="py-4 px-6">Service</th>
              <th className="py-4 px-6">Message</th>
              <th className="py-4 px-6 text-center">Severity</th>
              <th className="py-4 px-6 text-center">Status</th>
              <th className="py-4 px-6">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-darkBorder/40">
            {currentIncidents.map((incident) => {
              const isCritical = incident.severity === 'critical' || incident.severity === 'error';
              const isHigh = incident.severity === 'high';
              const isMedium = incident.severity === 'medium';
              
              const isPending = incident.status === 'pending_approval';
              const isResolved = incident.status === 'resolved' || incident.status === 'approved';
              const isRejected = incident.status === 'rejected';

              return (
                <tr 
                  key={incident.id}
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                  className="hover:bg-slate-900/30 cursor-pointer transition-colors"
                >
                  <td className="py-4 px-6 text-sm font-semibold text-blue-400 font-mono">
                    INC-{incident.id}
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-white">
                    {incident.service}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-300 max-w-sm truncate">
                    {incident.message}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                      isCritical
                        ? 'bg-rose-950/25 text-rose-500 border-rose-800/40'
                        : isHigh
                        ? 'bg-amber-950/25 text-amber-500 border-amber-800/40'
                        : isMedium
                        ? 'bg-blue-950/25 text-blue-500 border-blue-800/40'
                        : 'bg-emerald-950/25 text-emerald-500 border-emerald-800/40'
                    }`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center flex justify-center items-center">
                    {isPending ? (
                      <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-amber-950/20 border border-amber-800/30 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        <span>PENDING APPROVAL</span>
                      </div>
                    ) : isResolved ? (
                      <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-emerald-950/20 border border-emerald-800/30 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                        <span>RESOLVED</span>
                      </div>
                    ) : isRejected ? (
                      <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-rose-950/20 border border-rose-800/30 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
                        <span>REJECTED</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-indigo-950/20 border border-indigo-800/30 text-indigo-500 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span>INVESTIGATING</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-400">
                    {getRelativeTime(incident.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Empty State */}
        {filteredIncidents.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">System Healthy</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
              No active incidents match your criteria. All monitored systems are operating within normal parameters.
            </p>
          </div>
        )}

        {/* Pagination bar matching Image 2 bottom */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-darkBorder/40 bg-slate-950/10 text-xs text-slate-500 select-none">
          <span>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} incidents
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-900 border border-darkBorder hover:border-slate-700/60 hover:bg-slate-800/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <span className="font-semibold text-white font-mono">{currentPage}</span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-900 border border-darkBorder hover:border-slate-700/60 hover:bg-slate-800/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 3 Cards: GLOBAL HEALTH, RESPONSE TIME, SECURITY POSTURE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* GLOBAL HEALTH */}
        <div className="bg-darkCard/40 border border-darkBorder rounded-lg p-6 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Health</span>
            <Cloud className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white font-mono">99.98%</span>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              System-wide availability across all monitored nodes in the last 24 hours.
            </p>
          </div>
        </div>

        {/* RESPONSE TIME */}
        <div className="bg-darkCard/40 border border-darkBorder rounded-lg p-6 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Response Time</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white font-mono">142ms</span>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Mean response time across primary API gateways. +12ms deviation detected.
            </p>
          </div>
        </div>

        {/* SECURITY POSTURE */}
        <div className="bg-darkCard/40 border border-darkBorder rounded-lg p-6 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security Posture</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white">Optimal</span>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              No critical vulnerabilities or unauthorized access attempts in current session.
            </p>
          </div>
        </div>
      </div>
      <LodgeIncidentModal isOpen={isLodgeOpen} onClose={() => setIsLodgeOpen(false)} />
    </main>
  );
};
