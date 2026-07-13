import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

const MOCK_LOGS = [
  '12:51:30 [INFO] checkout-service - Accessing health check',
  '12:51:32 [INFO] promtail - Scraped 42 active log lines',
  '12:51:35 [INFO] checkout-service - Checkout request received from client_uid=9412',
  '12:51:35 [INFO] checkout-service - Database connection pool size is 12 active/50 max',
  '12:51:35 [INFO] checkout-service - Calling external stripe gateway authorized success',
  '12:51:36 [INFO] checkout-service - Order ord_84223 saved successfully to postgres primary',
  '12:51:40 [INFO] prometheus - Scraping checkout-service endpoint /metrics',
  '12:51:41 [INFO] checkout-service - Accessing health check',
  '12:51:45 [INFO] loki - Chunk compression completed: saved 23.4KB space',
  '12:51:50 [INFO] checkout-service - Accessing health check'
];

export const LogStreamView: React.FC = () => {
  const [logs, setLogs] = useState<string[]>(MOCK_LOGS);
  const [copied, setCopied] = useState(false);

  // Add random incoming logs to simulate live stream
  useEffect(() => {
    const services = ['checkout-service', 'auth-service', 'db-primary', 'api-gateway', 'sentinel-backend'];
    const actions = [
      'Accessing health check',
      'Database connection verified successfully',
      'Scraped active metrics successfully',
      'Cache lookup hit for key session_9410',
      'Stripe client request completed successfully',
      'Order transaction committed successfully'
    ];

    const interval = setInterval(() => {
      const date = new Date();
      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
      const service = services[Math.floor(Math.random() * services.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const newLog = `${timeStr} [INFO] ${service} - ${action}`;
      
      setLogs(prev => [...prev.slice(-30), newLog]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex-1 bg-darkBg p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-8 select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Log Stream</h1>
        <p className="text-sm text-slate-500 mt-1">Live aggregate application logs captured from Loki, Promtail, and Docker containers.</p>
      </div>

      {/* Terminal Display */}
      <div className="bg-[#040810] border border-darkBorder rounded-lg overflow-hidden backdrop-blur-md">
        
        {/* Terminal Header */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-darkBorder/40">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <Terminal className="w-4 h-4 text-blue-500" />
            <span>tail -f sentinel_aggregate_stream.log</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 transition-colors px-3 py-1.5 rounded bg-slate-900 border border-darkBorder"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy log stream'}</span>
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-6 font-mono text-[11px] leading-relaxed text-slate-300 h-96 overflow-y-auto space-y-2 select-text">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start">
              <span className="text-slate-600 text-right pr-4 select-none w-8">{idx + 1}</span>
              <span className="text-slate-300">
                <span className="text-slate-500 opacity-60 mr-2">{log.substring(0, 8)}</span>
                <span className="text-blue-400 font-semibold">{log.substring(9, 15)}</span>
                <span>{log.substring(15)}</span>
              </span>
            </div>
          ))}
        </div>

      </div>

    </main>
  );
};
