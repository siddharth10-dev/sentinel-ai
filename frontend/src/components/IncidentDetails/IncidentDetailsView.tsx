import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { 
  Clipboard, 
  Check, 
  AlertTriangle, 
  Terminal, 
  Cpu, 
  GitBranch, 
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Sidebar } from '../Shared/Sidebar';
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
  investigation: {
    logs: string[];
    metrics: Record<string, string>;
    deployment: {
      latest_commit: string;
    };
  };
  root_cause: {
    root_cause: string;
    confidence: number;
    reasoning: string[];
  };
  runbook: {
    matched_runbook: string;
    recommended_steps: string[];
  };
  recommendation: {
    impact: string;
    actions: string[];
    risk: string;
  };
  timeline: string[];
  status: string;
  communication?: {
    incident_report: string;
    executive_summary: string;
    slack_message: string;
  };
  created_at: string;
  resolved_at?: string;
}

export const IncidentDetailsView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'logs' | 'metrics' | 'deployment'>('logs');
  const [activeCommTab, setActiveCommTab] = useState<'report' | 'summary' | 'slack'>('report');
  
  // Local checklist for runbook steps
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  
  // Clipboard copy helper states
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [copiedSlack, setCopiedSlack] = useState(false);

  const { data: incident, isLoading, error } = useQuery<Incident>({
    queryKey: ['incident', id],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/incidents/${id}`);
      return res.data;
    },
    refetchInterval: (query) => {
      // Poll faster if it is investigating or pending approval to capture immediate state transitions
      const status = query.state.data?.status;
      return (status === 'investigating' || status === 'pending_approval') ? 2000 : 10000;
    }
  });

  // Reset checked runbook steps when runbook changes
  useEffect(() => {
    if (incident?.runbook?.recommended_steps) {
      const initial: Record<string, boolean> = {};
      incident.runbook.recommended_steps.forEach((step, idx) => {
        // First step checked by default matching Image 1
        initial[step] = idx === 0;
      });
      setCheckedSteps(initial);
    }
  }, [incident?.runbook?.recommended_steps]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${API_BASE_URL}/incidents/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${API_BASE_URL}/incidents/${id}/reject`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStepToggle = (step: string) => {
    setCheckedSteps(prev => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-darkBg p-8 flex flex-col justify-center items-center text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Investigating incident trace details...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex-1 bg-darkBg p-8 flex flex-col justify-center items-center text-rose-500">
        <AlertTriangle className="w-8 h-8 mb-4 animate-bounce" />
        <p className="text-sm font-semibold">Incident not found or backend unreachable.</p>
        <Link to="/incidents" className="mt-4 text-xs font-semibold text-blue-400 hover:underline">
          &larr; Back to Incidents list
        </Link>
      </div>
    );
  }

  const isPending = incident.status === 'pending_approval';
  const isResolved = incident.status === 'resolved' || incident.status === 'approved';
  const isRejected = incident.status === 'rejected';
  const isCritical = incident.severity === 'critical' || incident.severity === 'error';

  const investigation = incident.investigation || {};
  const logs = investigation.logs || [];
  const metrics = investigation.metrics || {};
  const deployment = investigation.deployment || { latest_commit: 'Fetching commit details...' };

  const rootCause = incident.root_cause || {};
  const rootCauseTitle = rootCause.root_cause || 'Analyzing logs & tracing events...';
  const confidence = rootCause.confidence || 0;
  const reasoning = rootCause.reasoning || [];

  const runbook = incident.runbook || {};
  const matchedRunbook = runbook.matched_runbook || 'Searching RAG for matching runbook...';
  const recommendedSteps = runbook.recommended_steps || [];

  const recommendation = incident.recommendation || {};
  const risk = recommendation.risk || 'Analyzing...';
  const impact = recommendation.impact || 'Kyro AI is assessing risk and mitigation impact...';
  const actions = recommendation.actions || [];

  return (
    <div className="flex flex-1 bg-darkBg">
      {/* Left Navigation Sidebar */}
      <Sidebar activeItem="Incidents" />

      {/* Main content pane */}
      <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full select-none space-y-6">
        
        {/* Content Header Navbar */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono font-semibold text-slate-500">
              INC-{incident.id} / <span className="text-slate-400">{incident.service}</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mt-2">
              {incident.classification?.summary || incident.message}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`text-xs font-bold font-mono px-3 py-1 rounded border uppercase tracking-wider ${
              isCritical
                ? 'bg-rose-950/30 text-rose-400 border-rose-800/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
                : 'bg-amber-950/30 text-amber-400 border-amber-800/40'
            }`}>
              {incident.severity}
            </span>
            
            <span className={`text-xs font-bold font-mono px-3 py-1 rounded border uppercase tracking-wider flex items-center space-x-1.5 ${
              isPending
                ? 'bg-amber-950/20 text-amber-400 border-amber-800/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                : isResolved
                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30'
                : 'bg-rose-950/20 text-rose-400 border-rose-800/30'
            }`}>
              {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
              <span>{incident.status.replace('_', ' ')}</span>
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left/Middle Content: Tabs & Terminal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Investigation Tabs Navigation */}
            <div className="border-b border-darkBorder flex space-x-6 select-none">
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-2 text-sm font-semibold relative transition-colors ${
                  activeTab === 'logs' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Logs
                {activeTab === 'logs' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`py-2 text-sm font-semibold relative transition-colors ${
                  activeTab === 'metrics' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Metrics
                {activeTab === 'metrics' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('deployment')}
                className={`py-2 text-sm font-semibold relative transition-colors ${
                  activeTab === 'deployment' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Deployment
                {activeTab === 'deployment' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                )}
              </button>
            </div>

            {/* Tab Panels */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
              {activeTab === 'logs' && (
                <div>
                  {/* Terminal Header */}
                  <div className="bg-white/[0.03] px-4 py-3 flex items-center justify-between border-b border-white/[0.08]">
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                      <Terminal className="w-3.5 h-3.5 text-blue-500" />
                      <span>tail -f {incident.service}.log</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(logs.join('\n'), setCopiedLogs)}
                      className="text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 transition-colors px-2 py-1 rounded bg-slate-900 border border-darkBorder"
                    >
                      {copiedLogs ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                      <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  
                  {/* Terminal Body */}
                  <div className="p-5 font-mono text-xs overflow-y-auto max-h-96 leading-relaxed select-text space-y-1.5 h-80">
                    {logs.map((logLine, idx) => {
                      let colorClass = 'text-slate-400';
                      if (logLine.includes('[ERROR]') || logLine.includes('Exception') || logLine.includes('Failed')) {
                        colorClass = 'text-rose-400 font-semibold';
                      } else if (logLine.includes('[WARNING]')) {
                        colorClass = 'text-amber-400';
                      } else if (logLine.includes('KYRO:')) {
                        colorClass = 'text-emerald-400 font-semibold';
                      } else if (logLine.includes('[DEBUG]')) {
                        colorClass = 'text-slate-500';
                      } else if (logLine.includes('[INFO]')) {
                        colorClass = 'text-slate-300';
                      }
                      
                      // Split timestamp from text if formatting matches
                      const timestamp = logLine.substring(0, 19);
                      const rest = logLine.substring(19);

                      return (
                        <div key={idx} className="flex items-start">
                          <span className="text-slate-600 text-right pr-4 select-none w-8 font-mono">{idx + 1}</span>
                          <span className={colorClass}>
                            <span className="text-slate-500 opacity-60 mr-2">{timestamp}</span>
                            <span>{rest}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'metrics' && (
                <div className="p-6 space-y-6 min-h-80">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-white">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Scraped Metrics Metrics</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(metrics).map(([key, val]) => (
                      <div key={key} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">{key}</span>
                        <div className="text-xl font-bold text-white font-mono mt-1">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'deployment' && (
                <div className="p-6 space-y-6 min-h-80">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-white">
                    <GitBranch className="w-4 h-4 text-blue-400" />
                    <span>Deployment Artifacts Metadata</span>
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Latest Commit</span>
                    <div className="font-mono text-sm text-blue-400">{deployment.latest_commit}</div>
                    <div className="text-xs text-slate-500 leading-relaxed mt-2">
                      Automatically resolved latest commit reference from Git metadata tags in checkout repository.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Timeline Section */}
            <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase pb-4 border-b border-white/[0.08]">
                Investigation Timeline & Audit Trail
              </h3>
              
              <div className="mt-6 relative pl-6 border-l border-white/[0.08] space-y-4">
                {incident.timeline.map((step, idx) => {
                  const [time, ...descParts] = step.split(' ');
                  const desc = descParts.join(' ');
                  
                  // Active pulsing indicator for the last step if pending
                  const isLast = idx === incident.timeline.length - 1;
                  const isStepPending = isPending && isLast;

                  return (
                    <div key={idx} className="relative flex items-center justify-between gap-4">
                      {/* Vertical connector bubble */}
                      <div className="absolute -left-[31.5px] top-1/2 -translate-y-1/2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 z-10 ${
                          isStepPending 
                            ? 'bg-[#0E131F] border-amber-500 shadow-[0_0_8px_#f59e0b]' 
                            : 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        }`}>
                          {isStepPending && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          )}
                        </div>
                      </div>

                      {/* Timeline Card */}
                      <div className="flex-grow flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-xl p-3 px-4 transition-all duration-300">
                        <span className="text-xs font-semibold text-slate-200">{desc}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-md">
                          {time.includes(':') ? time : 'System'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approval Controls Container */}
            {isPending && (
              <div className="bg-amber-950/10 border border-amber-900/30 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md shadow-lg shadow-amber-950/5 pulse-glow-amber">
                <div>
                  <h3 className="text-md font-bold text-amber-500 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span>Human Approval Required</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">
                    Kyro AI has diagnosed the issue and generated recovery recommendations. Please review and Approve to execute resolutions, or Reject to cancel.
                  </p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => rejectMutation.mutate()}
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-rose-900/40 hover:border-rose-700/60 rounded text-sm font-semibold text-rose-400 transition-all flex items-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => approveMutation.mutate()}
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-bold text-white shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Recommendation</span>
                  </button>
                </div>
              </div>
            )}

            {/* Rejected State display */}
            {isRejected && (
              <div className="bg-rose-950/10 border border-rose-900/30 rounded-lg p-5 flex items-center space-x-3 text-rose-400 text-sm">
                <XCircle className="w-5 h-5" />
                <span>This incident trace analysis was rejected by a human engineer. Status is final.</span>
              </div>
            )}

            {/* Post-Incident Communications Panel (Phases 5) */}
            {isResolved && incident.communication && (
              <div className="bg-darkCard/40 border border-darkBorder rounded-lg p-6 backdrop-blur-md space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-darkBorder/40">
                  <div>
                    <h2 className="text-md font-bold text-white">Post-Incident Communications</h2>
                    <p className="text-xs text-slate-500 mt-1">Generated report summaries for Slack and post-mortems.</p>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex space-x-3 border-b border-darkBorder/40 pb-0 text-xs select-none">
                  <button
                    onClick={() => setActiveCommTab('report')}
                    className={`pb-2 px-1 relative font-semibold ${
                      activeCommTab === 'report' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Incident Post-Mortem Report
                  </button>
                  <button
                    onClick={() => setActiveCommTab('summary')}
                    className={`pb-2 px-1 relative font-semibold ${
                      activeCommTab === 'summary' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Executive Summary
                  </button>
                  <button
                    onClick={() => setActiveCommTab('slack')}
                    className={`pb-2 px-1 relative font-semibold ${
                      activeCommTab === 'slack' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Slack Notification
                  </button>
                </div>

                <div className="mt-4">
                  {activeCommTab === 'report' && (
                    <div className="prose prose-invert prose-sm max-w-none bg-slate-950/40 border border-darkBorder rounded p-5 font-sans leading-relaxed select-text text-slate-300 max-h-80 overflow-y-auto">
                      <ReactMarkdown>{incident.communication.incident_report}</ReactMarkdown>
                    </div>
                  )}

                  {activeCommTab === 'summary' && (
                    <div className="bg-slate-950/40 border border-darkBorder rounded p-5 text-sm text-slate-300 leading-relaxed font-sans select-text">
                      {incident.communication.executive_summary}
                    </div>
                  )}

                  {activeCommTab === 'slack' && (
                    <div className="space-y-3">
                      <div className="bg-[#090D16] border border-darkBorder rounded p-4 font-sans text-sm text-emerald-400 select-text whitespace-pre-wrap leading-relaxed h-48 overflow-y-auto">
                        {incident.communication.slack_message}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => copyToClipboard(incident.communication?.slack_message || '', setCopiedSlack)}
                          className="px-4 py-1.5 bg-slate-900 border border-darkBorder hover:border-slate-700/60 rounded text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors"
                        >
                          {copiedSlack ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                          <span>{copiedSlack ? 'Copied' : 'Copy Slack Message'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: AI Analysis cards (Confidence, Runbook steps, Recommendation actions) */}
          <div className="space-y-6">
            
            {/* Card 1: ROOT CAUSE ANALYSIS */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Root Cause Analysis</span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-white/[0.08] text-slate-400 border border-white/[0.08]">
                  {Math.round(confidence * 100)}% Confidence
                </span>
              </div>
              
              <div className="mt-4">
                <h3 className="text-md font-bold text-white">{rootCauseTitle}</h3>
                
                {/* Confidence bar matching Image 1 */}
                <div className="w-full h-1.5 bg-white/[0.08] rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6] transition-all duration-1000"
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>

                <ul className="mt-6 space-y-3">
                  {reasoning.map((item, idx) => (
                    <li key={idx} className="flex items-start text-xs text-slate-400 leading-relaxed font-sans">
                      <div className="w-4 h-4 rounded-full bg-blue-950/20 border border-blue-800/40 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                        <Check className="w-2.5 h-2.5 text-blue-400" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card 2: ACTIVE RUNBOOK */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 shadow-xl">
              <div className="pb-4 border-b border-white/[0.08]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Runbook</span>
                <h3 className="text-sm font-semibold text-slate-300 mt-2">{matchedRunbook}</h3>
              </div>

              <div className="mt-4 space-y-3">
                {recommendedSteps.map((step, idx) => {
                  const isChecked = !!checkedSteps[step];
                  return (
                    <div 
                      key={idx}
                      onClick={() => handleStepToggle(step)}
                      className={`flex items-start p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked 
                          ? 'bg-white/[0.08] border-white/[0.15] text-slate-200' 
                          : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] text-slate-500'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 mt-0.5 shrink-0 transition-colors ${
                        isChecked 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-xs leading-relaxed">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 3: RECOMMENDATION */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommendation</span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 uppercase tracking-wider">
                  {risk} Risk
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {impact}
                </p>

                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</span>
                  <ul className="mt-2 space-y-2">
                    {actions.map((act, idx) => (
                      <li key={idx} className="flex items-start text-xs text-slate-300 font-sans leading-relaxed">
                        <span className="mr-2 text-blue-500">&bull;</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
