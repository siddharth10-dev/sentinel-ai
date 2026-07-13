import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { X, Play, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

interface LodgeIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  '🚨 Alert received & classified by AI agent...',
  '🔍 Investigation started: inspecting container metrics...',
  '💻 Searching Loki database: extracting service error logs...',
  '🧠 Performing root cause analysis & checking Git deployment metadata...',
  '📚 Searching RAG vector database for matching playbooks...',
  '⚡ Recommendation generated & waiting for human action...'
];

export const LodgeIncidentModal: React.FC<LodgeIncidentModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [service, setService] = useState('checkout-service');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('critical');
  const [loading, setLoading] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Animate steps while backend loads
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev < STEPS.length - 1) return prev + 1;
          return prev;
        });
      }, 1500);
    } else {
      setCurrentStepIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/incident', {
        service,
        message,
        severity
      });
      
      const newIncidentId = res.data?.incident_id;
      
      // Let the steps finish loading for 500ms before navigating
      setTimeout(() => {
        setLoading(false);
        onClose();
        if (newIncidentId) {
          navigate(`/incidents/${newIncidentId}`);
        } else {
          // Fallback to list
          navigate('/incidents');
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Error triggering SRE AI agent. Please check backend connection.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0E131F] border border-darkBorder rounded-lg overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-darkBorder/40 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <ShieldAlert className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-md">Lodge SRE Incident</span>
          </div>
          {!loading && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        {!loading ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Service */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Name</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full bg-[#090D16] border border-darkBorder rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                <option value="checkout-service">checkout-service</option>
                <option value="auth-service">auth-service</option>
                <option value="db-primary">db-primary</option>
                <option value="api-gateway">api-gateway</option>
                <option value="search-v3">search-v3</option>
              </select>
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-[#090D16] border border-darkBorder rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Alert Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alert / Error Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Stripe payment gateway returned HTTP 504 gateway timeout during payment checkout"
                rows={3}
                required
                className="w-full bg-[#090D16] border border-darkBorder rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-darkBorder/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 border border-darkBorder hover:border-slate-700/60 rounded text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold text-white flex items-center space-x-1.5 transition-colors shadow-lg shadow-blue-600/15"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Launch Sentinel Agent</span>
              </button>
            </div>
          </form>
        ) : (
          /* Live loader screen showing AI workflow */
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <div className="absolute w-8 h-8 rounded bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-xs font-mono font-bold text-blue-400">
                AI
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-md font-bold text-white">Sentinel Agent Active</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Running LangGraph workflow nodes. Sentinel is executing ReAct loop steps.
              </p>
            </div>

            {/* Animation Steps progress */}
            <div className="w-full bg-[#090D16] border border-darkBorder rounded p-4 text-left font-mono text-xs text-slate-400 space-y-2 max-h-48 overflow-y-auto">
              {STEPS.slice(0, currentStepIdx + 1).map((step, idx) => {
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={idx} className="flex items-center space-x-2">
                    {isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className={isCurrent ? 'text-white font-semibold' : 'text-slate-500'}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
