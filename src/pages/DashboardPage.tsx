import { useEffect, useState, useRef } from 'react';
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
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';

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

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const from = ref.current;
    const to = value;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / 1000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    ref.current = value;
  }, [value]);
  return <>{prefix}{formatNumber(display)}{suffix}</>;
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
      numericValue: stats ? stats.revenue.total_revenue : 0,
      prefix: '₴ ',
      suffix: '',
      icon: DollarSign,
      gradient: 'linear-gradient(135deg, #00D4AA, #00B894)',
    },
    {
      label: t('dashboard_page.orders_count'),
      numericValue: stats ? stats.orders.total : 0,
      prefix: '',
      suffix: '',
      icon: ShoppingCart,
      gradient: 'linear-gradient(135deg, #4A90D9, #357ABD)',
    },
    {
      label: t('dashboard_page.clients_count'),
      numericValue: stats ? stats.clients.total : 0,
      prefix: '',
      suffix: '',
      icon: Users,
      gradient: 'linear-gradient(135deg, #9B59B6, #8E44AD)',
    },
    {
      label: t('dashboard_page.avg_check'),
      numericValue: avgCheck,
      prefix: '₴ ',
      suffix: '',
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #136579, #1a8a9e)',
    },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      new: { label: t('orders.new'), bg: 'rgba(74,144,217,0.15)', color: '#4A90D9' },
      pending: { label: t('orders.pending'), bg: 'rgba(241,196,15,0.15)', color: '#F1C40F' },
      processing: { label: t('orders.processing'), bg: 'rgba(241,196,15,0.15)', color: '#F1C40F' },
      completed: { label: t('orders.completed'), bg: 'rgba(0,212,170,0.15)', color: '#00D4AA' },
      cancelled: { label: t('orders.cancelled'), bg: 'rgba(231,76,60,0.15)', color: '#E74C3C' },
    };
    const st = map[status] ?? { label: status, bg: 'rgba(255,255,255,0.06)', color: '#888' };
    return (
      <span
        style={{
          background: st.bg,
          color: st.color,
          padding: '4px 12px',
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {st.label}
      </span>
    );
  };

  if (loading) {
    return <Spinner className="py-24" size="lg" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((c, i) => (
          <GlassCard key={i} index={i} tilt className="p-5 flex items-center gap-4">
            <div
              style={{
                background: c.gradient,
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <c.icon size={22} color="#fff" />
            </div>
            <div className="min-w-0">
              <p style={{ color: 'var(--color-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                {c.label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>
                {stats ? (
                  <AnimatedNumber value={c.numericValue} prefix={c.prefix} suffix={c.suffix} />
                ) : '—'}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Revenue Chart */}
      <GlassCard tilt={false} className="p-6">
        <h2 className="text-base font-semibold mb-4">{t('dashboard_page.monthly_revenue')}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(255, 107, 107, 0.25)" stopOpacity={1} />
                <stop offset="95%" stopColor="rgba(255, 107, 107, 0)" stopOpacity={0} />
              </linearGradient>
              <filter id="chartGlow">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(0, 212, 170, 0.5)" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3E" />
            <XAxis dataKey="date" stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(26,26,46,0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: '#E0E0E0',
              }}
              formatter={(v) => [`₴ ${formatNumber(v as number)}`, t('dashboard_page.total_revenue')]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#00D4AA"
              fill="url(#chartGrad)"
              strokeWidth={2}
              style={{ filter: 'url(#chartGlow)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Two-column: Orders + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <GlassCard tilt={false} className="p-5">
          <h2 className="text-base font-semibold mb-3">{t('dashboard_page.recent_orders')}</h2>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr>
                  <th className="table-header text-left py-2 pr-3">ID</th>
                  <th className="table-header text-left py-2 pr-3">{t('orders.client')}</th>
                  <th className="table-header text-right py-2 pr-3">{t('orders.amount')}</th>
                  <th className="table-header text-left py-2">{t('orders.status')}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-muted">{t('dashboard_page.no_data')}</td></tr>
                ) : recentOrders.map((o) => (
                  <tr key={o.id} className="table-row-hover border-b border-border/40">
                    <td className="py-2.5 pr-3 text-muted">#{o.id}</td>
                    <td className="py-2.5 pr-3">{o.client_name || '—'}</td>
                    <td className="py-2.5 pr-3 text-right text-teal whitespace-nowrap">₴ {formatNumber(o.total_amount)}</td>
                    <td className="py-2.5">{statusBadge(o.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Top Clients */}
        <GlassCard tilt={false} className="p-5">
          <h2 className="text-base font-semibold mb-3">{t('dashboard_page.top_clients')}</h2>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr>
                  <th className="table-header text-left py-2 pr-3">{t('clients.name')}</th>
                  <th className="table-header text-left py-2 pr-3">{t('clients.company')}</th>
                  <th className="table-header text-right py-2 pr-3">{t('clients.ordersCount')}</th>
                  <th className="table-header text-right py-2">{t('orders.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {topClients.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-muted">{t('dashboard_page.no_data')}</td></tr>
                ) : topClients.map((c) => (
                  <tr key={c.id} className="table-row-hover border-b border-border/40">
                    <td className="py-2.5 pr-3">{c.name}</td>
                    <td className="py-2.5 pr-3 text-muted">{c.company || '—'}</td>
                    <td className="py-2.5 pr-3 text-right">{c.order_count}</td>
                    <td className="py-2.5 text-right text-teal whitespace-nowrap">₴ {formatNumber(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* GinCoin Balance */}
      <GlassCard tilt={false} className="p-5 flex items-center gap-4 mt-6">
        <div
          style={{
            background: 'linear-gradient(135deg, #B8860B, #FFD700)',
            width: 44,
            height: 44,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Coins size={22} color="#fff" />
        </div>
        <div>
          <p style={{ color: 'var(--color-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('dashboard_page.gincoin_balance')}
          </p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#FFD700' }}>
            <AnimatedNumber value={1250} /> GC
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
