import React from 'react';
import { ShieldAlert, ShieldCheck, Check, Lock } from 'lucide-react';

export const SecurityPostureView: React.FC = () => {
  const securityLogs = [
    '12:50:02 INFO [sec.audit] Port scan detected on external interface from IP 185.220.101.4',
    '12:47:11 INFO [sec.iam] Revoked inactive API credentials for service auth-service/v1.0-beta',
    '12:35:45 INFO [sec.waf] Blocked SQL Injection attempt targeting /checkout/payment path',
    '12:15:00 INFO [sec.compliance] Automated SOC2 security compliance checklist completed successfully',
    '11:42:19 WARN [sec.cert] SSL Certificate for payment-gateway domain expiring in 14 days. Auto-renew scheduled.'
  ];

  const vulnerabilityChecks = [
    { name: 'CVE-2026-9041 (OAuth secret exposure patch)', patched: true },
    { name: 'CVE-2025-3341 (Redis unauthorized access bind)', patched: true },
    { name: 'CVE-2024-5231 (HTTP/2 Rapid Reset Mitigation)', patched: true },
    { name: 'SSL/TLS Cipher Suite Hardening Check', patched: true }
  ];

  return (
    <main className="flex-1 bg-darkBg p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-8 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Posture</h1>
          <p className="text-sm text-slate-500 mt-1">Live firewall audit traces, intrusion prevention records, and active CVE patch states.</p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-emerald-950/20 border border-emerald-800/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>SOC2 COMPLIANT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Intrusion Prevention Terminal Log */}
        <div className="lg:col-span-2 bg-darkCard/40 border border-darkBorder rounded-lg p-6 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
            <span>Intrusion Prevention Audit Trace</span>
          </h2>
          
          <div className="bg-[#040810] border border-darkBorder rounded overflow-hidden">
            <div className="bg-slate-950 px-4 py-2 border-b border-darkBorder/40 text-[10px] font-mono text-slate-500">
              tail -f security_audit.log
            </div>
            <div className="p-4 font-mono text-[11px] text-slate-300 space-y-2 h-64 overflow-y-auto leading-relaxed select-text">
              {securityLogs.map((log, idx) => (
                <div key={idx} className="flex space-x-3">
                  <span className="text-slate-600">{idx + 1}</span>
                  <span className={log.includes('WARN') ? 'text-amber-400' : 'text-slate-300'}>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: CVE vulnerability patches */}
        <div className="bg-darkCard/40 border border-darkBorder rounded-lg p-6 backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>CVE Vulnerability Checklist</span>
            </h2>
            
            <div className="space-y-3 pt-2">
              {vulnerabilityChecks.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded bg-slate-950/40 border border-darkBorder/60">
                  <span className="text-xs font-mono font-medium text-slate-400">{item.name}</span>
                  <div className="w-5 h-5 rounded-full bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-darkBorder p-4 rounded text-xs text-slate-500 mt-6 leading-relaxed">
            All system images are automatically audited by Sentinel Guard scanning tools prior to docker-compose orchestration.
          </div>
        </div>

      </div>

    </main>
  );
};
