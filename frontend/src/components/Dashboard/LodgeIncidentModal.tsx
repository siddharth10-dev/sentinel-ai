import React, { useState } from 'react';
import axios from 'axios';
import { X, Loader2, ShieldAlert, Activity, Database, Server, CreditCard, Cpu } from 'lucide-react';

import { API_BASE_URL, SIMULATOR_BASE_URL } from '../../config';

interface LodgeIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LodgeIncidentModal: React.FC<LodgeIncidentModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSimulate = async (type: string, endpoint: string) => {
    setLoading(type);
    setMessage('');
    try {
      // 1. Trigger the checkout-service simulation
      await axios.post(`${SIMULATOR_BASE_URL}/simulate/${endpoint}?enable=true`);
      
      // 2. Since Alertmanager requires Docker, we send a mock Alertmanager webhook
      // to the Kyro backend so you can watch the autonomous flow end-to-end.
      const mockAlerts: Record<string, any> = {
        'database-error': {
          alertname: 'DatabaseFailure',
          summary: 'Database connection failed',
          description: 'Checkout service lost connection to the database.',
          severity: 'critical'
        },
        'high-latency': {
          alertname: 'HighLatency',
          summary: 'High latency detected',
          description: 'Average request latency has exceeded 500ms.',
          severity: 'warning'
        },
        'payment-failure': {
          alertname: 'PaymentGatewayFailure',
          summary: 'Payment Gateway Failure',
          description: 'Payment processing is failing.',
          severity: 'critical'
        },
        'cpu-spike': {
          alertname: 'HighCPUUsage',
          summary: 'High CPU Usage',
          description: 'CPU usage is above 90%.',
          severity: 'critical'
        },
        'memory-leak': {
          alertname: 'HighMemoryUsage',
          summary: 'High Memory Usage (Leak suspected)',
          description: 'Memory usage is above 85%.',
          severity: 'warning'
        }
      };

      const alertDetails = mockAlerts[endpoint];
      const res = await axios.post(`${API_BASE_URL}/incident`, {
        alerts: [
          {
            status: 'firing',
            labels: {
              alertname: alertDetails.alertname,
              service: 'checkout-service',
              severity: alertDetails.severity
            },
            annotations: {
              summary: alertDetails.summary,
              description: alertDetails.description
            }
          }
        ]
      });

      const newIncidentId = res.data?.incident_id;
      setMessage(`Simulated ${type}. Initializing Kyro AI Agent...`);
      
      setTimeout(() => {
        setLoading(null);
        onClose();
        if (newIncidentId) {
          // Force page navigation or trigger route change
          window.location.href = `/incidents/${newIncidentId}`;
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage(`Error simulating ${type}.`);
      setLoading(null);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0E131F] border border-darkBorder rounded-lg overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-darkBorder/40 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <ShieldAlert className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-md">Simulation Control Panel</span>
          </div>
          {!loading && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-400 mb-4">
            Trigger simulated failures in the checkout-service. Prometheus will detect the metrics anomalies, Alertmanager will fire a webhook, and Kyro AI will autonomously start investigating.
          </p>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleSimulate('Database Error', 'database-error')}
              disabled={loading !== null}
              className="flex items-center p-4 bg-[#090D16] border border-darkBorder rounded hover:border-slate-600 transition-colors"
            >
              <Database className="w-5 h-5 text-red-500 mr-3" />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Database Connection Failure</div>
                <div className="text-xs text-slate-500">Drops DB health to 0</div>
              </div>
              {loading === 'Database Error' && <Loader2 className="ml-auto w-4 h-4 animate-spin text-blue-500" />}
            </button>

            <button
              onClick={() => handleSimulate('High Latency', 'high-latency')}
              disabled={loading !== null}
              className="flex items-center p-4 bg-[#090D16] border border-darkBorder rounded hover:border-slate-600 transition-colors"
            >
              <Activity className="w-5 h-5 text-orange-500 mr-3" />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">High Latency</div>
                <div className="text-xs text-slate-500">Sleeps for 5 seconds on checkout</div>
              </div>
              {loading === 'High Latency' && <Loader2 className="ml-auto w-4 h-4 animate-spin text-blue-500" />}
            </button>

            <button
              onClick={() => handleSimulate('Payment Failure', 'payment-failure')}
              disabled={loading !== null}
              className="flex items-center p-4 bg-[#090D16] border border-darkBorder rounded hover:border-slate-600 transition-colors"
            >
              <CreditCard className="w-5 h-5 text-purple-500 mr-3" />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Payment Gateway Failure</div>
                <div className="text-xs text-slate-500">Payment endpoint fails</div>
              </div>
              {loading === 'Payment Failure' && <Loader2 className="ml-auto w-4 h-4 animate-spin text-blue-500" />}
            </button>

            <button
              onClick={() => handleSimulate('CPU Spike', 'cpu-spike')}
              disabled={loading !== null}
              className="flex items-center p-4 bg-[#090D16] border border-darkBorder rounded hover:border-slate-600 transition-colors"
            >
              <Cpu className="w-5 h-5 text-yellow-500 mr-3" />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">CPU Spike</div>
                <div className="text-xs text-slate-500">Spikes CPU metric to 95%</div>
              </div>
              {loading === 'CPU Spike' && <Loader2 className="ml-auto w-4 h-4 animate-spin text-blue-500" />}
            </button>
            
            <button
              onClick={() => handleSimulate('Memory Leak', 'memory-leak')}
              disabled={loading !== null}
              className="flex items-center p-4 bg-[#090D16] border border-darkBorder rounded hover:border-slate-600 transition-colors"
            >
              <Server className="w-5 h-5 text-blue-500 mr-3" />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Memory Leak</div>
                <div className="text-xs text-slate-500">Spikes Memory metric to 90%</div>
              </div>
              {loading === 'Memory Leak' && <Loader2 className="ml-auto w-4 h-4 animate-spin text-blue-500" />}
            </button>
          </div>

          {message && (
            <div className="mt-4 text-sm text-green-400 p-3 bg-green-900/20 border border-green-800/50 rounded">
              {message}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
