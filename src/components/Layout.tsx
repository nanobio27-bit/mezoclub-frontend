import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '../stores/authStore';

const pageTitles: Record<string, string> = {
  '/dashboard': 'pages.dashboard',
  '/clients': 'pages.clients',
  '/catalog': 'pages.catalog',
  '/orders': 'pages.orders',
  '/gincoin': 'pages.gincoin',
  '/rating': 'pages.rating',
  '/kpi': 'pages.kpi',
  '/settings': 'pages.settings',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const { fetchProfile, user } = useAuthStore();

  useEffect(() => {
    if (!user) fetchProfile();
  }, []);

  const titleKey = pageTitles[location.pathname] || 'pages.dashboard';

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header title={t(titleKey)} collapsed={collapsed} />
      <main
        className="transition-all min-h-screen"
        style={{ marginLeft: collapsed ? 64 : 260, paddingTop: 80 }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
