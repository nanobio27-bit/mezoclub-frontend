import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { formatNumber } from '../utils/format';
import Spinner from '../components/Spinner';
import GlassCard from '../components/GlassCard';

interface Order {
  id: number;
  client_id: number;
  user_id: number;
  status: string;
  total_amount: number;
  discount_amount: number;
  payment_status: string;
  notes: string;
  created_at: string;
  client?: { name: string };
}

const STATUS_KEYS: Record<string, string> = {
  new: 'orders.new',
  processing: 'orders.processing',
  completed: 'orders.completed',
  cancelled: 'orders.cancelled',
};

const statusStyles: Record<string, { bg: string; color: string }> = {
  new: { bg: 'rgba(74,144,217,0.15)', color: '#4A90D9' },
  processing: { bg: 'rgba(241,196,15,0.15)', color: '#F1C40F' },
  completed: { bg: 'rgba(0,212,170,0.15)', color: '#00D4AA' },
  cancelled: { bg: 'rgba(231,76,60,0.15)', color: '#E74C3C' },
};

const PAYMENT_KEYS: Record<string, string> = {
  pending: 'orders.pending',
  paid: 'orders.paid',
  refunded: 'orders.refunded',
};

const FILTER_KEYS = [
  { labelKey: 'orders.all', value: '' },
  { labelKey: 'orders.new', value: 'new' },
  { labelKey: 'orders.processing', value: 'processing' },
  { labelKey: 'orders.completed', value: 'completed' },
  { labelKey: 'orders.cancelled', value: 'cancelled' },
];

export default function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit };
        if (status) params.status = status;
        const { data } = await api.get('/orders', { params });
        setOrders(data.data);
        setTotal(data.total);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [status, page]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
        <button
          onClick={() => navigate('/orders/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          {t('orders.create')}
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {FILTER_KEYS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
              status === opt.value
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white font-medium'
                : 'btn-secondary'
            }`}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <Spinner className="py-12" /> : <>
      {orders.length > 0 ? (
        <GlassCard tilt={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-4 py-3 font-medium">№</th>
                  <th className="text-left px-4 py-3 font-medium">{t('orders.client')}</th>
                  <th className="text-right px-4 py-3 font-medium">{t('orders.amountUah')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('orders.status')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('orders.payment')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('orders.date')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const sStyle = statusStyles[order.status] || { bg: 'rgba(255,255,255,0.1)', color: '#ffffff' };
                  return (
                    <tr
                      key={order.id}
                      className="table-row-hover"
                    >
                      <td className="px-4 py-3 font-medium">{order.id}</td>
                      <td className="px-4 py-3">{order.client?.name || t('orders.clientFallback', { id: order.client_id })}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatNumber(order.total_amount)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: sStyle.bg, color: sStyle.color }}
                        >
                          {t(STATUS_KEYS[order.status]) || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {t(PAYMENT_KEYS[order.payment_status]) || order.payment_status}
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(order.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <GlassCard tilt={false} className="p-8 text-center">
          <p className="text-muted">{t('orders.noOrders')}</p>
        </GlassCard>
      )}
      </>}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm transition-colors cursor-pointer ${
                page === p
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white'
                  : 'bg-bg border border-border text-muted hover:text-text'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
