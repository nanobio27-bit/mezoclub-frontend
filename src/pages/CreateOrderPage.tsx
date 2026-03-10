import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Trash2, ArrowLeft, ArrowRight, Check, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { formatNumber } from '../utils/format';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  segment: string;
  status: string;
  personal_discount: number;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  brand: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const steps = ['Клиент', 'Товары', 'Подтверждение'];

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: Client
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const debouncedClientSearch = useDebounce(clientSearch, 300);

  // Step 2: Products
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const debouncedProductSearch = useDebounce(productSearch, 300);

  // Step 3: Submit
  const [submitting, setSubmitting] = useState(false);

  // Fetch clients
  useEffect(() => {
    if (!debouncedClientSearch) {
      setClients([]);
      return;
    }
    const fetch = async () => {
      try {
        const { data } = await api.get('/clients', {
          params: { search: debouncedClientSearch, limit: 10 },
        });
        setClients(data.data);
      } catch {
        /* ignore */
      }
    };
    fetch();
  }, [debouncedClientSearch]);

  // Fetch products
  useEffect(() => {
    if (!debouncedProductSearch) {
      setProducts([]);
      return;
    }
    const fetch = async () => {
      try {
        const { data } = await api.get('/products', {
          params: { search: debouncedProductSearch, limit: 10 },
        });
        setProducts(data.data);
      } catch {
        /* ignore */
      }
    };
    fetch();
  }, [debouncedProductSearch]);

  const addToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: qty }]);
    }
    setQuantities({ ...quantities, [product.id]: 1 });
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const orderTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const gcClient = Math.floor((orderTotal * 10) / 100);
  const gcManager = Math.floor((orderTotal * 10) / 100);

  const canGoNext = () => {
    if (step === 1) return !!selectedClient;
    if (step === 2) return cart.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedClient || cart.length === 0) return;
    setSubmitting(true);
    try {
      await api.post('/orders', {
        client_id: selectedClient.id,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });
      navigate('/orders');
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold">Новый заказ</h1>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              {idx > 0 && (
                <div className={`w-8 h-px ${isDone ? 'bg-gold' : 'bg-border'}`} />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive
                      ? 'bg-gold text-white'
                      : isDone
                      ? 'bg-gold/20 text-gold'
                      : 'bg-card border border-border text-muted'
                  }`}
                >
                  {isDone ? <Check size={14} /> : stepNum}
                </div>
                <span className={`text-sm hidden sm:inline ${isActive ? 'text-gold' : 'text-muted'}`}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Client */}
      {step === 1 && (
        <div className="space-y-4">
          {selectedClient ? (
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{selectedClient.name}</p>
                  <p className="text-sm text-muted">{selectedClient.phone} &middot; {selectedClient.email}</p>
                  {selectedClient.company && (
                    <p className="text-sm text-muted">{selectedClient.company}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-error text-sm hover:underline cursor-pointer"
                >
                  Изменить
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Поиск клиента по имени, телефону..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-text focus:outline-none focus:border-gold"
                />
              </div>
              {clients.length > 0 && (
                <div className="bg-card rounded-xl border border-border divide-y divide-border">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setClientSearch('');
                        setClients([]);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-bg/50 transition-colors cursor-pointer"
                    >
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted">{client.phone} &middot; {client.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 2: Products */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Поиск товара..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-text focus:outline-none focus:border-gold"
            />
          </div>

          {products.length > 0 && (
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted">{formatNumber(product.price)} ₴</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={product.stock_quantity}
                    value={quantities[product.id] || 1}
                    onChange={(e) =>
                      setQuantities({ ...quantities, [product.id]: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-16 bg-bg border border-border rounded-lg px-2 py-1.5 text-text text-center text-sm focus:outline-none focus:border-gold"
                  />
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-gold hover:bg-gold-hover text-white rounded-lg p-2 transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Cart */}
          {cart.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <ShoppingCart size={18} className="text-gold" />
                <span className="font-bold text-sm">Корзина</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-xs text-muted font-normal uppercase text-left px-4 py-2">Товар</th>
                    <th className="text-xs text-muted font-normal uppercase text-right px-4 py-2">Цена</th>
                    <th className="text-xs text-muted font-normal uppercase text-center px-4 py-2">Кол-во</th>
                    <th className="text-xs text-muted font-normal uppercase text-right px-4 py-2">Итого</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr
                      key={item.product.id}
                      className={`border-b border-border ${idx % 2 === 1 ? 'bg-bg/30' : ''}`}
                    >
                      <td className="px-4 py-2">{item.product.name}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(item.product.price)}</td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatNumber(item.product.price * item.quantity)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-error hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-border text-right">
                <span className="text-muted text-sm">Итого: </span>
                <span className="text-gold font-bold text-lg">{formatNumber(orderTotal)} ₴</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Client summary */}
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs text-muted uppercase mb-2">Клиент</p>
            <p className="font-bold">{selectedClient?.name}</p>
            <p className="text-sm text-muted">{selectedClient?.phone} &middot; {selectedClient?.email}</p>
          </div>

          {/* Items summary */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs text-muted uppercase">Товары</p>
            </div>
            {cart.map((item, idx) => (
              <div
                key={item.product.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  idx < cart.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted">{item.quantity} x {formatNumber(item.product.price)} ₴</p>
                </div>
                <p className="text-sm font-medium">{formatNumber(item.product.price * item.quantity)} ₴</p>
              </div>
            ))}
            <div className="px-4 py-3 border-t border-border flex justify-between">
              <span className="font-bold">Итого</span>
              <span className="text-gold font-bold">{formatNumber(orderTotal)} ₴</span>
            </div>
          </div>

          {/* GinCoin info boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-4">
              <p className="text-sm text-gold font-medium">Клиенту будет начислено</p>
              <p className="text-2xl font-bold text-gold">{formatNumber(gcClient)} GC</p>
            </div>
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-4">
              <p className="text-sm text-gold font-medium">Менеджеру будет начислено</p>
              <p className="text-2xl font-bold text-gold">{formatNumber(gcManager)} GC</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => (step === 1 ? navigate('/orders') : setStep(step - 1))}
          className="bg-card border border-border text-muted hover:text-text rounded-lg px-4 py-2 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Назад
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canGoNext()}
            className="bg-gold hover:bg-gold-hover text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Далее
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gold hover:bg-gold-hover text-white rounded-lg px-6 py-2 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Check size={16} />
            {submitting ? 'Оформление...' : 'Оформить заказ'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
