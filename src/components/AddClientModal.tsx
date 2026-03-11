import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../api/client';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddClientModal({ onClose, onSuccess }: Props) {
  const { t } = useTranslation();
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
      setError(t('add_client_modal.name_required'));
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
      setError(msg || t('add_client_modal.save_error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg glass-card p-6 mx-4"
        style={{ borderRadius: 20 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{t('add_client_modal.title')}</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">{t('add_client_modal.name_label')}</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t('add_client_modal.name_placeholder')}
              className="input-glass"
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
                className="input-glass"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">{t('add_client_modal.phone')}</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+380..."
                className="input-glass"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">{t('add_client_modal.company')}</label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder={t('add_client_modal.company_placeholder')}
              className="input-glass"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">{t('add_client_modal.segment')}</label>
              <select name="segment" value={form.segment} onChange={handleChange} className="input-glass">
                <option value="">{t('add_client_modal.not_specified')}</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">{t('add_client_modal.source')}</label>
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder={t('add_client_modal.source_placeholder')}
                className="input-glass"
              />
            </div>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              {t('add_client_modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? t('add_client_modal.saving') : t('add_client_modal.create')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
