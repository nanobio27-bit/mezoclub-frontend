import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  Tag,
  Coins,
  ShoppingCart,
} from 'lucide-react';
import api from '../api/client';
import { formatNumber } from '../utils/format';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  segment: string;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get(`/clients/${id}`);
        setClient(res.data.data ?? res.data);
      } catch (err) {
        console.error('Client fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  async function handleDelete() {
    if (!confirm('Удалить клиента?')) return;
    setDeleting(true);
    try {
      await api.delete(`/clients/${id}`);
      navigate('/clients');
    } catch (err) {
      console.error('Delete error:', err);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64">
        <div className="text-muted">Загрузка...</div>
      </motion.div>
    );
  }

  if (!client) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <p className="text-muted mb-4">Клиент не найден</p>
        <button onClick={() => navigate('/clients')} className="text-gold hover:text-gold-hover transition-colors">
          Вернуться к списку
        </button>
      </motion.div>
    );
  }

  const infoItems = [
    { icon: Mail, label: 'Email', value: client.email },
    { icon: Phone, label: 'Телефон', value: client.phone },
    { icon: Building2, label: 'Компания', value: client.company },
    { icon: Tag, label: 'Сегмент', value: client.segment },
    { icon: Tag, label: 'Источник', value: client.source },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={18} />
          Назад к списку
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/clients/${id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted hover:text-text transition-colors"
          >
            <Pencil size={16} />
            Редактировать
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-error/50 text-error hover:bg-error/10 transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} />
            Удалить
          </button>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xl font-bold">
            {client.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-semibold">{client.name}</h1>
            <span className="px-2 py-0.5 rounded text-xs bg-green/20 text-green">
              {client.status || 'active'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {infoItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <item.icon size={18} className="text-muted flex-shrink-0" />
              <div>
                <p className="text-xs text-muted">{item.label}</p>
                <p className="text-sm">{item.value || '—'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border text-sm text-muted">
          Создан: {new Date(client.created_at).toLocaleDateString('ru-RU')}
          {client.updated_at && (
            <span className="ml-4">
              Обновлён: {new Date(client.updated_at).toLocaleDateString('ru-RU')}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders History (stub) */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={20} className="text-muted" />
            <h2 className="text-lg font-semibold">История заказов</h2>
          </div>
          <div className="text-center py-8 text-muted">
            <p>История заказов пока недоступна</p>
          </div>
        </div>

        {/* GinCoin Balance (stub) */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Coins size={20} className="text-gold" />
            <h2 className="text-lg font-semibold">GinCoin баланс</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-lg bg-bg">
              <Coins size={32} className="text-gold" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gold">{formatNumber(0)} GC</p>
              <p className="text-sm text-muted">Баланс бонусных монет</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
