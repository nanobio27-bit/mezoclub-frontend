import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../api/client';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddClientModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    segment: '',
    source: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Имя обязательно');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/clients', form);
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || 'Ошибка при создании клиента');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:border-gold transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg bg-card rounded-xl border border-border p-6 mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Новый клиент</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Имя *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Иван Иванов"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Телефон</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+380..."
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Компания</label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="ООО Компания"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Сегмент</label>
              <select name="segment" value={form.segment} onChange={handleChange} className={inputClass}>
                <option value="">Не указан</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Источник</label>
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="Сайт, реклама..."
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-muted hover:text-text transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-gold hover:bg-gold-hover text-bg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Создать'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
