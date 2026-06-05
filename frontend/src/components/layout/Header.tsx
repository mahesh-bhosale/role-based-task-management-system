import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Bell, LogOut, Menu, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { getInitials, roleBadgeColor, roleLabel, timeAgo } from '../../lib/utils';
import { Badge } from '../ui/badge';

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  if (!user) return null;

  return (
    <header className={`h-16 fixed top-0 right-0 left-0 transition-all duration-200 ease-in-out ${isSidebarOpen ? 'md:left-64' : 'left-0'} bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-20 flex items-center justify-between px-4 sm:px-6`}>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2 text-slate-400 hover:text-white" onClick={onMenuToggle}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 bg-slate-900 border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h4 className="font-semibold text-white">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs text-primary">
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-slate-800/50 cursor-pointer transition-colors hover:bg-slate-800 ${
                      !notif.isRead ? 'bg-slate-800/30' : ''
                    }`}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                      <div>
                        <p className={`text-sm ${!notif.isRead ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{timeAgo(notif.sentAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-slate-700 p-0 hover:ring-2 ring-slate-600 transition-all">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-slate-800 text-slate-300 font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">{user.name}</p>
                <p className="text-xs leading-none text-slate-400">{user.email}</p>
                <div className="mt-2">
                  <Badge variant="outline" className={`text-xs ${roleBadgeColor(user.role)}`}>
                    {roleLabel(user.role)}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer">
              <Link to="/profile">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => logout()}
              className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
