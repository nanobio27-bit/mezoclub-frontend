import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Plus } from 'lucide-react';
import api from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { formatNumber } from '../utils/format';
import { useAuthStore } from '../stores/authStore';
import Spinner from '../components/Spinner';

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

const categories = [
  { label: 'Все', value: '' },
  { label: 'Филлеры', value: 'Филлеры' },
  { label: 'Мезотерапия', value: 'Мезотерапия' },
  { label: 'Кремы', value: 'Кремы' },
  { label: 'Биодобавки', value: 'Биодобавки' },
  { label: 'Нити', value: 'Нити' },
  { label: 'Оборудование', value: 'Оборудование' },
];

export default function CatalogPage() {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Каталог товаров</h1>
        {user?.role === 'admin' && (
          <button className="bg-gold hover:bg-gold-hover text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors cursor-pointer">
            <Plus size={18} />
            Добавить товар
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Поиск по названию или SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-text focus:outline-none focus:border-gold"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setBrand(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
              brand === cat.value
                ? 'bg-gold text-white'
                : 'bg-card border border-border text-muted hover:text-text'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? <Spinner className="py-12" /> : <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3"
          >
            {/* Placeholder image */}
            <div className="w-full aspect-square bg-bg rounded-lg flex items-center justify-center">
              <Package size={48} className="text-muted" />
            </div>

            {/* Name */}
            <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.name}</h3>

            {/* Price */}
            <p className="text-gold font-bold text-lg">{formatNumber(product.price)} ₴</p>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-bg border border-border text-muted">
                  {product.brand}
                </span>
              )}
              {product.price > 1000 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gold/20 text-gold">
                  GinCoin
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="mt-auto">
              <span
                className={`text-xs font-medium ${
                  product.stock_quantity > product.min_stock_level ? 'text-green' : 'text-error'
                }`}
              >
                В наличии: {product.stock_quantity} шт.
              </span>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted">Товары не найдены</p>
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
