import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';
import Particles from './Particles';
import { useAuthStore } from '../stores/authStore';

const pageTitleKeys: Record<string, string> = {
  '/dashboard': 'pages.dashboard',
  '/clients': 'pages.clients',
  '/catalog': 'pages.catalog',
  '/orders': 'pages.orders',
  '/orders/new': 'orders.create',
  '/gincoin': 'pages.gincoin',
  '/gincoin/shop': 'gincoin.shopTitle',
  '/rating': 'pages.rating',
  '/kpi': 'pages.kpi',
  '/settings': 'pages.settings',
};

function getTitleKey(pathname: string): string {
  // Exact match first
  if (pageTitleKeys[pathname]) return pageTitleKeys[pathname];
  // /clients/:id
  if (pathname.startsWith('/clients/')) return 'pages.clients';
  // Default
  return 'pages.dashboard';
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const { fetchProfile, user } = useAuthStore();

  useEffect(() => {
    if (!user) fetchProfile();
  }, []);

  const titleKey = getTitleKey(location.pathname);

  return (
    <div className="min-h-screen bg-bg">
      <Particles />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header title={t(titleKey)} collapsed={collapsed} />
      <main
        className="transition-all min-h-screen relative z-10"
        style={{ marginLeft: collapsed ? 72 : 260, paddingTop: 80 }}
      >
        <div style={{ padding: '24px 32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
