import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, Search, Plus } from 'lucide-react';
import api from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { formatNumber } from '../utils/format';
import { useAuthStore } from '../stores/authStore';
import Spinner from '../components/Spinner';
import GlassCard from '../components/GlassCard';

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

const CATEGORY_KEYS = [
  { labelKey: 'catalog.all', value: '' },
  { labelKey: 'catalog.fillers', value: 'Филлеры' },
  { labelKey: 'catalog.meso', value: 'Мезотерапия' },
  { labelKey: 'catalog.creams', value: 'Кремы' },
  { labelKey: 'catalog.supplements', value: 'Биодобавки' },
  { labelKey: 'catalog.threads', value: 'Нити' },
  { labelKey: 'catalog.equipment', value: 'Оборудование' },
];

export default function CatalogPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, brand]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/products', {
          params: { search: debouncedSearch, brand, page, limit },
        });
        setProducts(data.data);
        setTotal(data.total);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch, brand, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('catalog.productsTitle')}</h1>
        {user?.role === 'admin' && (
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            {t('catalog.add')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder={t('catalog.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-glass pr-4 py-2.5"
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_KEYS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setBrand(cat.value)}
            className="cursor-pointer"
            style={
              brand === cat.value
                ? {
                    background: 'linear-gradient(135deg, #136579, #1a8a9e)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(19,101,121,0.3)',
                    transition: 'all 0.2s',
                  }
                : {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--color-muted)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }
            }
          >
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? (
        <Spinner className="py-12" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <GlassCard key={product.id} index={i} tilt className="p-4 flex flex-col gap-3">
                {/* Placeholder image */}
                <div className="w-full aspect-square glass-card rounded-lg flex items-center justify-center">
                  <Package size={48} className="text-muted" />
                </div>

                {/* Name */}
                <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.name}</h3>

                {/* Price */}
                <p style={{ fontSize: 20, fontWeight: 700, color: '#00D4AA' }}>
                  {formatNumber(product.price)} ₴
                </p>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  {product.brand && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-white/10 bg-[rgba(255,255,255,0.06)] text-muted">
                      {product.brand}
                    </span>
                  )}
                  {product.price > 1000 && (
                    <span
                      style={{
                        background: 'linear-gradient(135deg, #136579, #1a8a9e)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 9999,
                        padding: '2px 10px',
                      }}
                    >
                      GinCoin
                    </span>
                  )}
                </div>

                {/* Stock indicator */}
                <div className="mt-auto">
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: product.stock_quantity > product.min_stock_level ? '#00D4AA' : '#E74C3C',
                    }}
                  >
                    {t('catalog.inStock', { count: product.stock_quantity })}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>

          {products.length === 0 && (
            <GlassCard tilt={false} className="p-8 text-center">
              <p className="text-muted">{t('catalog.notFound')}</p>
            </GlassCard>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="cursor-pointer"
              style={
                page === p
                  ? {
                      background: 'linear-gradient(135deg, #136579, #1a8a9e)',
                      color: '#fff',
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      border: 'none',
                    }
                  : {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--color-muted)',
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      fontSize: 14,
                    }
              }
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
