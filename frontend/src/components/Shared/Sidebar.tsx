import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  AlertOctagon, 
  GitBranch, 
  SearchCode, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  activeItem?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem = 'Incidents' }) => {
  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Incidents', icon: AlertOctagon, path: '/incidents' },
    { name: 'Deployments', icon: GitBranch, path: '/incidents' },
    { name: 'Threat Hunting', icon: SearchCode, path: '/security' },
  ];

  return (
    <aside className="w-64 border-r border-darkBorder bg-[#090D16] flex flex-col justify-between p-4 select-none min-h-[calc(100vh-4rem)]">
      {/* Top Menu */}
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.name === activeItem;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-slate-800/60 text-white font-semibold shadow-inner' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Menu */}
      <div className="space-y-1 pt-4 border-t border-darkBorder/40">
        <div className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 cursor-not-allowed">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>Help Center</span>
        </div>
        <Link to="/" className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-400 hover:text-rose-400 transition-colors">
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>Log Out</span>
        </Link>
      </div>
    </aside>
  );
};
