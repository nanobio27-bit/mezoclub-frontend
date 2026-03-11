import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import AddClientModal from '../components/AddClientModal';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  created_at: string;
}

export default function ClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients', {
        params: { search: debouncedSearch || undefined, page, limit },
      });
      setClients(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      console.error('Clients fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / limit));


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-semibold">{t('pages.clients')}</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-hover text-bg font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          {t('clients_page.add_client')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder={t('clients_page.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted border-b border-border">
                <th className="text-left py-3 px-4">{t('clients_page.name')}</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">{t('clients_page.phone')}</th>
                <th className="text-left py-3 px-4">{t('clients_page.company')}</th>
                <th className="text-left py-3 px-4">{t('clients_page.status')}</th>
                <th className="text-left py-3 px-4">{t('clients_page.created_at')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">
                    {t('common.loading')}
                  </td>
                </tr>
              )}
              {!loading && clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">
                    {t('clients_page.not_found')}
                  </td>
                </tr>
              )}
              {!loading &&
                clients.map((client, idx) => (
                  <tr
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className={`border-b border-border/50 hover:bg-sidebar cursor-pointer transition-colors ${
                      idx % 2 === 0 ? 'bg-bg' : 'bg-card'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium">{client.name}</td>
                    <td className="py-3 px-4 text-muted">{client.email || '—'}</td>
                    <td className="py-3 px-4 text-muted">{client.phone || '—'}</td>
                    <td className="py-3 px-4">{client.company || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs bg-green/20 text-green">
                        {client.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {client.created_at
                        ? new Date(client.created_at).toLocaleDateString('ru-RU')
                        : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
          <span className="text-muted">
            {t('clients_page.total')}: {total} {t('clients_page.clients')}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded hover:bg-sidebar disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-muted">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded hover:bg-sidebar disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {modalOpen && (
        <AddClientModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            fetchClients();
          }}
        />
      )}
    </motion.div>
  );
}
