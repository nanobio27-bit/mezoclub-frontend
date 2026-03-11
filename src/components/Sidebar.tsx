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
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'rgba(17, 17, 40, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      className="fixed left-0 top-0 h-screen border-r border-border flex flex-col z-50"
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between border-b border-border"
        style={{ height: 64, paddingLeft: collapsed ? 16 : 20, paddingRight: 16, marginBottom: 24 }}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #B8860B, #FFD700)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            MezoClub
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg transition-colors text-muted hover:text-text cursor-pointer"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto" style={{ paddingLeft: 8, paddingRight: 8 }}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            style={({ isActive }) => ({
              fontSize: 14,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? '#B8860B' : undefined,
              backgroundColor: isActive ? 'rgba(184,134,11,0.12)' : 'transparent',
              borderLeft: isActive ? '3px solid #B8860B' : '3px solid transparent',
              paddingLeft: 20,
            })}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? '' : 'text-muted'
              }`
            }
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }
            }}
            onMouseLeave={(e) => {
              const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
              e.currentTarget.style.backgroundColor = isActive ? 'rgba(184,134,11,0.12)' : 'transparent';
            }}
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && (
              <span className="whitespace-nowrap">
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
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted hover:text-error transition-colors w-full cursor-pointer"
          style={{ fontSize: 14, fontWeight: 400, backgroundColor: 'transparent', paddingLeft: 20 }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>{t('auth.logout')}</span>}
        </button>
      </div>
    </motion.aside>
  );
}
