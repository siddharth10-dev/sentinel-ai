import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';

interface HeaderProps {
  systemStatus?: 'healthy' | 'warning' | 'critical';
}

export const Header: React.FC<HeaderProps> = () => {
  const location = useLocation();

  const isDashboardActive = location.pathname === '/' || location.pathname === '/dashboard';
  const isIncidentsActive = location.pathname.startsWith('/incidents');
  const isSecurityActive = location.pathname === '/security';
  const isLogsActive = location.pathname === '/logs';

  return (
    <header className="h-16 border-b border-darkBorder bg-darkBg px-6 flex items-center justify-between select-none">
      {/* Left: Logo and Nav Links */}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          {/* Custom Sentinel AI Shield Icon */}
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white text-xs font-bold font-mono">S</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Sentinel AI</span>
        </div>

        <nav className="flex space-x-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors py-5 relative ${
              isDashboardActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dashboard
            {isDashboardActive && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            )}
          </Link>
          <Link
            to="/incidents"
            className={`text-sm font-medium transition-colors py-5 relative ${
              isIncidentsActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Incidents
            {isIncidentsActive && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            )}
          </Link>
          <Link
            to="/security"
            className={`text-sm font-medium transition-colors py-5 relative ${
              isSecurityActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Security
            {isSecurityActive && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            )}
          </Link>
          <Link
            to="/logs"
            className={`text-sm font-medium transition-colors py-5 relative ${
              isLogsActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Logs
            {isLogsActive && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            )}
          </Link>
        </nav>
      </div>

      {/* Right: Controls & Profile */}
      <div className="flex items-center space-x-4">
        {/* Optional Status Pill (for Dashboard view) */}
        {isDashboardActive && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/20 border border-emerald-800/30 text-xs font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SYSTEM: HEALTHY</span>
          </div>
        )}

        {/* Command Center button (shown on list and details) */}
        {!isDashboardActive && (
          <button className="px-4 py-1.5 rounded bg-blue-950/40 border border-blue-800/40 text-xs font-semibold text-blue-400 hover:bg-blue-900/30 transition-colors">
            Incident Command Center
          </button>
        )}

        <button className="p-1.5 rounded hover:bg-slate-800/40 text-slate-400 hover:text-white transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        <button className="p-1.5 rounded hover:bg-slate-800/40 text-slate-400 hover:text-white transition-colors">
          <Settings className="w-4 h-4" />
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    </header>
  );
};
