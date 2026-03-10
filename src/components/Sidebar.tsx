import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Coins,
  Star,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'dealer'] },
  { key: 'clients', path: '/clients', icon: Users, roles: ['admin', 'manager', 'dealer'] },
  { key: 'catalog', path: '/catalog', icon: Package, roles: ['admin', 'manager'] },
  { key: 'orders', path: '/orders', icon: ShoppingCart, roles: ['admin', 'manager', 'dealer'] },
  { key: 'gincoin', path: '/gincoin', icon: Coins, roles: ['admin', 'manager', 'dealer'] },
  { key: 'rating', path: '/rating', icon: Star, roles: ['admin', 'manager'] },
  { key: 'kpi', path: '/kpi', icon: BarChart3, roles: ['admin', 'manager'] },
  { key: 'settings', path: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const { logout, user } = useAuthStore();
  const userRole = user?.role || 'manager';

  const visibleItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-border flex flex-col z-50"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold text-gold"
          >
            MezoClub
          </motion.span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-card transition-colors text-muted hover:text-text cursor-pointer"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gold/15 text-gold'
                  : 'text-muted hover:bg-card hover:text-text'
              }`
            }
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && (
              <span className="text-sm font-normal whitespace-nowrap">
                {t(`menu.${item.key}`)}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted hover:bg-card hover:text-error transition-colors w-full cursor-pointer"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="text-sm">{t('auth.logout')}</span>}
        </button>
      </div>
    </motion.aside>
  );
}
