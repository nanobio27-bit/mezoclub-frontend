import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { formatNumber } from '../utils/format';
import Spinner from '../components/Spinner';

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

const statusLabels: Record<string, string> = {
  new: 'Новый',
  processing: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-green/20 text-green',
  cancelled: 'bg-error/20 text-error',
};

const paymentLabels: Record<string, string> = {
  pending: 'Ожидает',
  paid: 'Оплачено',
  refunded: 'Возврат',
};

const filterOptions = [
  { label: 'Все', value: '' },
  { label: 'Новый', value: 'new' },
  { label: 'В работе', value: 'processing' },
  { label: 'Завершён', value: 'completed' },
  { label: 'Отменён', value: 'cancelled' },
];

export default function OrdersPage() {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <button
          onClick={() => navigate('/orders/new')}
          className="bg-gold hover:bg-gold-hover text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus size={18} />
          Создать заказ
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
              status === opt.value
                ? 'bg-gold text-white'
                : 'bg-card border border-border text-muted hover:text-text'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <Spinner className="py-12" /> : <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-xs text-muted font-normal uppercase text-left px-4 py-3">№</th>
                <th className="text-xs text-muted font-normal uppercase text-left px-4 py-3">Клиент</th>
                <th className="text-xs text-muted font-normal uppercase text-right px-4 py-3">Сумма (₴)</th>
                <th className="text-xs text-muted font-normal uppercase text-left px-4 py-3">Статус</th>
                <th className="text-xs text-muted font-normal uppercase text-left px-4 py-3">Оплата</th>
                <th className="text-xs text-muted font-normal uppercase text-left px-4 py-3">Дата</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr
                  key={order.id}
                  className={`border-b border-border hover:bg-bg/50 transition-colors ${
                    idx % 2 === 1 ? 'bg-bg/30' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{order.id}</td>
                  <td className="px-4 py-3">{order.client?.name || `Клиент #${order.client_id}`}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatNumber(order.total_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || ''}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {paymentLabels[order.payment_status] || order.payment_status}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted">Заказы не найдены</p>
        </div>
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
                  ? 'bg-gold text-white'
                  : 'bg-card border border-border text-muted hover:text-text'
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
