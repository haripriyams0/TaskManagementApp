import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X, LayoutDashboard, Users, ClipboardList, Upload, UserCheck, Settings } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({ sidebarOpen, setSidebarOpen, userRole }) => {
  const location = useLocation();

  // Navigation items based on user role
  const adminNavigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Agent Management',
      href: '/admin/agents',
      icon: Users,
    },
    {
      name: 'Task Management',
      href: '/admin/tasks',
      icon: ClipboardList,
    },
    {
      name: 'Upload CSV',
      href: '/admin/upload',
      icon: Upload,
    },
  ];

  const agentNavigation = [
    {
      name: 'Dashboard',
      href: '/agent/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'My Tasks',
      href: '/agent/tasks',
      icon: ClipboardList,
    },
  ];

  const navigation = userRole === 'admin' ? adminNavigation : agentNavigation;

  const isActive = (href) => location.pathname === href;

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">
              CSTechInfo
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200',
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon
                  className={clsx(
                    'mr-3 h-5 w-5 transition-colors duration-200',
                    isActive(item.href)
                      ? 'text-primary-600'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-500">
            <Settings className="h-4 w-4 mr-2" />
            <span className="capitalize">{userRole} Panel</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
