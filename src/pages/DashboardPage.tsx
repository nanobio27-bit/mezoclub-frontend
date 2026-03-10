import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Coins,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../api/client';
import { formatNumber } from '../utils/format';

interface Stats {
  clients: { total: number; new: number };
  orders: { total: number; new: number; completed: number };
  revenue: { total_revenue: number; monthly_revenue: number };
  products: { total: number; low_stock: number };
}

interface RecentOrder {
  id: number;
  client_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface TopClient {
  id: number;
  name: string;
  company: string;
  segment: string;
  order_count: number;
  total_spent: number;
}

function generateMockChartData() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      revenue: Math.floor(Math.random() * 50000) + 10000,
    });
  }
  return data;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData] = useState(() => generateMockChartData());

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, ordersRes, clientsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-orders'),
          api.get('/dashboard/top-clients'),
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data.data?.slice(0, 5) ?? []);
        setTopClients(clientsRes.data.data?.slice(0, 5) ?? []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const avgCheck =
    stats && Number(stats.orders.total) > 0
      ? Math.round(Number(stats.revenue.total_revenue) / Number(stats.orders.total))
      : 0;

  const statCards = [
    {
      label: t('dashboard_page.total_revenue'),
      value: stats ? `₴ ${formatNumber(stats.revenue.total_revenue)}` : '—',
      icon: DollarSign,
      color: 'text-gold',
    },
    {
      label: t('dashboard_page.orders_count'),
      value: stats ? formatNumber(stats.orders.total) : '—',
      icon: ShoppingCart,
      color: 'text-blue-400',
    },
    {
      label: t('dashboard_page.clients_count'),
      value: stats ? formatNumber(stats.clients.total) : '—',
      icon: Users,
      color: 'text-green',
    },
    {
      label: t('dashboard_page.avg_check'),
      value: stats ? `₴ ${formatNumber(avgCheck)}` : '—',
      icon: TrendingUp,
      color: 'text-gold',
    },
  ];

  const statusMap: Record<string, { label: string; cls: string }> = {
    new: { label: 'Новый', cls: 'text-blue-400' },
    pending: { label: 'Ожидает', cls: 'text-yellow-400' },
    processing: { label: 'В работе', cls: 'text-blue-400' },
    completed: { label: 'Завершён', cls: 'text-green' },
    cancelled: { label: 'Отменён', cls: 'text-error' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted">{t('dashboard_page.loading')}</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-bg ${c.color}`}>
              <c.icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-muted text-xs">{c.label}</p>
              <p className={`text-lg font-semibold truncate ${c.color}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart ── */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold mb-4">{t('dashboard_page.monthly_revenue')}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B8860B" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#B8860B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" />
            <XAxis dataKey="date" stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #2A2A3E', borderRadius: 8, color: '#E0E0E0' }}
              formatter={(v) => [`₴ ${formatNumber(v as number)}`, t('dashboard_page.total_revenue')]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#B8860B" fill="url(#goldGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Two-column: Orders + Top Clients ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold mb-3">{t('dashboard_page.recent_orders')}</h2>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-xs text-muted font-normal uppercase">ID</th>
                  <th className="text-left py-2 pr-3 text-xs text-muted font-normal uppercase">{t('clients_page.name') || 'Клиент'}</th>
                  <th className="text-right py-2 pr-3 text-xs text-muted font-normal uppercase">{t('dashboard_page.total_revenue') ? 'Сумма' : 'Сумма'}</th>
                  <th className="text-left py-2 text-xs text-muted font-normal uppercase">{t('clients_page.status') || 'Статус'}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-muted">{t('dashboard_page.no_data')}</td></tr>
                ) : recentOrders.map((o, i) => {
                  const st = statusMap[o.status] ?? { label: o.status, cls: 'text-muted' };
                  return (
                    <tr key={o.id} className={`border-b border-border/40 hover:bg-sidebar/60 transition-colors ${i % 2 === 0 ? '' : 'bg-bg/30'}`}>
                      <td className="py-2.5 pr-3 text-muted">#{o.id}</td>
                      <td className="py-2.5 pr-3">{o.client_name || '—'}</td>
                      <td className="py-2.5 pr-3 text-right text-gold whitespace-nowrap">₴ {formatNumber(o.total_amount)}</td>
                      <td className={`py-2.5 whitespace-nowrap ${st.cls}`}>{st.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold mb-3">{t('dashboard_page.top_clients')}</h2>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-xs text-muted font-normal uppercase">{t('clients_page.name') || 'Имя'}</th>
                  <th className="text-left py-2 pr-3 text-xs text-muted font-normal uppercase">{t('clients_page.company') || 'Компания'}</th>
                  <th className="text-right py-2 pr-3 text-xs text-muted font-normal uppercase">Заказов</th>
                  <th className="text-right py-2 text-xs text-muted font-normal uppercase">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {topClients.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-muted">{t('dashboard_page.no_data')}</td></tr>
                ) : topClients.map((c, i) => (
                  <tr key={c.id} className={`border-b border-border/40 hover:bg-sidebar/60 transition-colors ${i % 2 === 0 ? '' : 'bg-bg/30'}`}>
                    <td className="py-2.5 pr-3">{c.name}</td>
                    <td className="py-2.5 pr-3 text-muted">{c.company || '—'}</td>
                    <td className="py-2.5 pr-3 text-right">{c.order_count}</td>
                    <td className="py-2.5 text-right text-gold whitespace-nowrap">₴ {formatNumber(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── GinCoin Balance ── */}
      <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
        <div className="p-3 rounded-lg bg-bg text-gold">
          <Coins size={26} />
        </div>
        <div>
          <p className="text-muted text-xs">{t('dashboard_page.gincoin_balance')}</p>
          <p className="text-xl font-bold text-gold">{formatNumber(1250)} GC</p>
        </div>
      </div>
    </motion.div>
  );
}
