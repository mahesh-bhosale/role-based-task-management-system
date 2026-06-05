import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  BarChart3, 
  ShieldAlert, 
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../lib/constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  
  if (!user) return null;

  const role = user.role;
  
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE] },
    { name: 'Projects', path: '/projects', icon: FolderKanban, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
    { name: 'My Tasks', path: '/tasks', icon: CheckSquare, roles: [ROLES.EMPLOYEE] },
    { name: 'Work Logs', path: '/worklogs', icon: Clock, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
    { name: 'My Work Logs', path: '/my-worklogs', icon: Clock, roles: [ROLES.EMPLOYEE] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
    { name: 'Users', path: '/users', icon: Users, roles: [ROLES.ADMIN] },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, roles: [ROLES.ADMIN] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(role as any));

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden" 
          onClick={onClose} 
        />
      )}
      <aside className={`fixed inset-y-0 left-0 bg-slate-950 border-r border-slate-800 z-40 w-64 flex flex-col transform transition-transform duration-200 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-vividYellow">
          <CheckSquare className="h-6 w-6" />
          <span className="text-xl font-bold tracking-wider text-white">TaskFlow</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) {
                  onClose();
                }
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px] translate-x-[-1px] border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        TaskFlow v1.0
      </div>
    </aside>
    </>
  );
};
