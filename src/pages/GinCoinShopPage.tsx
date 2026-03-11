import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, X } from 'lucide-react';
import api from '../api/client';
import { formatNumber } from '../utils/format';
import { useAuthStore } from '../stores/authStore';

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  brand: string;
  is_active: boolean;
  created_at: string;
}

interface Balance {
  id: number;
  user_id: number;
  balance: number;
  total_earned: number;
  total_spent: number;
  level: string;
}

export default function GinCoinShopPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get('/gincoin/balance').then(({ data }) => setBalance(data)).catch(() => {});
    api
      .get('/products', { params: { page: 1, limit: 100 } })
      .then(({ data }) => {
        const filtered = (data.data as Product[]).filter((p) => p.price > 0);
        setProducts(filtered);
      })
      .catch(() => {});
  }, []);

  const handleExchange = async (product: Product) => {
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/gincoin/exchange', { productId: product.id, quantity: 1 });
      setMessage({ type: 'success', text: t('gincoin.exchangeSuccess', { name: product.name }) });
      const { data } = await api.get('/gincoin/balance');
      setBalance(data);
    } catch {
      setMessage({ type: 'error', text: t('gincoin.errorExchange') });
    } finally {
      setLoading(false);
      setConfirmProduct(null);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) return;
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/gincoin/withdraw', { amount });
      setMessage({ type: 'success', text: t('gincoin.withdrawSuccess', { amount: formatNumber(amount) }) });
      const { data } = await api.get('/gincoin/balance');
      setBalance(data);
    } catch {
      setMessage({ type: 'error', text: t('gincoin.withdrawError') });
    } finally {
      setLoading(false);
      setWithdrawOpen(false);
      setWithdrawAmount('');
    }
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('gincoin.shopTitle')}</h1>
        <div className="flex items-center gap-4">
          <span className="text-gold font-bold text-lg">
            {t('gincoin.balanceAmount', { amount: formatNumber(balance?.balance || 0) })}
          </span>
          {isManager && (
            <button
              onClick={() => setWithdrawOpen(true)}
              className="bg-gold hover:bg-gold-hover text-white rounded-lg px-4 py-2 transition-colors cursor-pointer font-semibold"
            >
              {t('gincoin.withdraw')}
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-3 text-sm font-medium ${
            message.type === 'success' ? 'bg-green/20 text-green' : 'bg-error/20 text-error'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3"
          >
            <div className="w-full aspect-square bg-bg rounded-lg flex items-center justify-center">
              <Package size={48} className="text-muted" />
            </div>

            <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.name}</h3>

            <p className="text-gold font-bold text-lg">{formatNumber(product.price)} GC</p>

            <div className="mt-auto">
              <button
                onClick={() => setConfirmProduct(product)}
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-hover text-white rounded-lg px-4 py-2 transition-colors cursor-pointer font-medium disabled:opacity-50"
              >
                {t('gincoin.exchangeBtn')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted">{t('gincoin.productsNotFound')}</p>
        </div>
      )}

      {/* Confirm exchange modal */}
      {confirmProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{t('gincoin.confirmation')}</h3>
              <button
                onClick={() => setConfirmProduct(null)}
                className="text-muted hover:text-text cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-text">
              {t('gincoin.exchangeConfirmText')} <span className="font-semibold">{confirmProduct.name}</span> {t('gincoin.exchangeConfirmFor')}{' '}
              <span className="text-gold font-bold">{formatNumber(confirmProduct.price)} GC</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmProduct(null)}
                className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-muted hover:text-text transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleExchange(confirmProduct)}
                disabled={loading}
                className="flex-1 bg-gold hover:bg-gold-hover text-white rounded-lg px-4 py-2 transition-colors cursor-pointer font-medium disabled:opacity-50"
              >
                {loading ? t('gincoin.exchangeLoading') : t('gincoin.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{t('gincoin.withdraw')}</h3>
              <button
                onClick={() => setWithdrawOpen(false)}
                className="text-muted hover:text-text cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">{t('gincoin.withdrawAmountLabel')}</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={t('gincoin.enterAmount')}
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-gold"
              />
              <p className="text-xs text-muted mt-1">
                {t('gincoin.available', { amount: formatNumber(balance?.balance || 0) })}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setWithdrawOpen(false)}
                className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-muted hover:text-text transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleWithdraw}
                disabled={loading || !withdrawAmount || Number(withdrawAmount) <= 0}
                className="flex-1 bg-gold hover:bg-gold-hover text-white rounded-lg px-4 py-2 transition-colors cursor-pointer font-medium disabled:opacity-50"
              >
                {loading ? t('gincoin.withdrawLoading') : t('gincoin.withdraw')}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
