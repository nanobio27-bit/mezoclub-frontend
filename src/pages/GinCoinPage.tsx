import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import api from '../api/client';
import { formatNumber } from '../utils/format';
import Spinner from '../components/Spinner';

interface Balance {
  id: number;
  user_id: number;
  balance: number;
  total_earned: number;
  total_spent: number;
  level: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  source: string;
  description: string;
  created_at: string;
}

interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

const LEVEL_CONFIG: Record<string, { color: string; label: string; next: number; min: number }> = {
  newcomer: { color: '#888888', label: 'Новичок', next: 1000, min: 0 },
  bronze: { color: '#CD7F32', label: 'Бронза', next: 5000, min: 1000 },
  silver: { color: '#C0C0C0', label: 'Серебро', next: 15000, min: 5000 },
  gold: { color: '#FFD700', label: 'Золото', next: 50000, min: 15000 },
  platinum: { color: '#E5E4E2', label: 'Платина', next: 50000, min: 50000 },
};

function getLevelProgress(level: string, totalEarned: number): number {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.newcomer;
  if (level === 'platinum') return 100;
  const range = config.next - config.min;
  if (range <= 0) return 100;
  const progress = ((totalEarned - config.min) / range) * 100;
  return Math.max(0, Math.min(100, progress));
}

function getNextLevelName(level: string): string | null {
  const order = ['newcomer', 'bronze', 'silver', 'gold', 'platinum'];
  const idx = order.indexOf(level);
  if (idx < 0 || idx >= order.length - 1) return null;
  return LEVEL_CONFIG[order[idx + 1]].label;
}

function getGCToNextLevel(level: string, totalEarned: number): number {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.newcomer;
  if (level === 'platinum') return 0;
  return Math.max(0, config.next - totalEarned);
}

function FlaskSVG({ level, percentage }: { level: string; percentage: number }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.newcomer;
  const liquidColor = config.color;
  const isPlatinum = level === 'platinum';

  // Fill height: 0% = y=280 (empty), 100% = y=20 (full)
  // Usable range inside flask is roughly y=25 to y=275
  const fillRange = 250;
  const fillY = 275 - (percentage / 100) * fillRange;

  const waveY = fillY;
  const waveD = `M 0 ${waveY + 5} Q 30 ${waveY - 5} 60 ${waveY + 5} Q 90 ${waveY + 15} 120 ${waveY + 5} Q 150 ${waveY - 5} 180 ${waveY + 5} Q 200 ${waveY + 15} 220 ${waveY + 5} L 220 300 L 0 300 Z`;

  return (
    <div className="relative flex justify-center">
      <svg
        viewBox="0 0 200 300"
        className="w-48 h-72"
        style={isPlatinum ? { filter: 'drop-shadow(0 0 12px rgba(229,228,226,0.6))' } : undefined}
      >
        <defs>
          <clipPath id="flaskClip">
            <path d="M 70 20 L 70 80 Q 20 120 20 180 L 20 260 Q 20 280 40 280 L 160 280 Q 180 280 180 260 L 180 180 Q 180 120 130 80 L 130 20 Z" />
          </clipPath>
        </defs>

        {/* Liquid fill */}
        <g clipPath="url(#flaskClip)">
          <rect x="0" y={fillY} width="200" height={300 - fillY} fill={liquidColor} opacity="0.5" />
          <path d={waveD} fill={liquidColor} opacity="0.75">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -20,0; 0,0"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
          <path d={waveD} fill={liquidColor} opacity="0.45" transform="translate(10, 3)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 15,0; 0,0"
              dur="4s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Flask outline */}
        <path
          d="M 70 20 L 70 80 Q 20 120 20 180 L 20 260 Q 20 280 40 280 L 160 280 Q 180 280 180 260 L 180 180 Q 180 120 130 80 L 130 20 Z"
          fill="none"
          stroke="#2A2A3E"
          strokeWidth="3"
        />
        {/* Flask cap */}
        <rect x="65" y="10" width="70" height="15" rx="4" fill="#2A2A3E" />
      </svg>
    </div>
  );
}

export default function GinCoinPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const txLimit = 10;

  useEffect(() => {
    api.get('/gincoin/balance').then(({ data }) => { setBalance(data); setLoading(false); }).catch(() => { setLoading(false); });
  }, []);

  useEffect(() => {
    api
      .get<TransactionsResponse>('/gincoin/transactions', { params: { page: txPage, limit: txLimit } })
      .then(({ data }) => {
        setTransactions(data.data);
        setTxTotal(data.total);
      })
      .catch(() => {});
  }, [txPage]);

  const level = balance?.level || 'newcomer';
  const totalEarned = balance?.total_earned || 0;
  const currentBalance = balance?.balance || 0;

  const percentage = useMemo(() => getLevelProgress(level, totalEarned), [level, totalEarned]);
  const nextLevelName = getNextLevelName(level);
  const gcToNext = getGCToNextLevel(level, totalEarned);
  const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG.newcomer;

  const txTotalPages = Math.ceil(txTotal / txLimit);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <h1 className="text-2xl font-bold">Мой Кувшин</h1>

      {loading ? <Spinner className="py-12" /> : <>
      {/* Flask section */}
      <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center gap-6">
        <FlaskSVG level={level} percentage={percentage} />

        {/* Balance */}
        <p className="text-2xl font-bold text-gold">
          {formatNumber(currentBalance)} GinCoin = {formatNumber(currentBalance)} ₴
        </p>

        {/* Level badge */}
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: levelConfig.color }}
          />
          <span className="font-semibold text-text">{levelConfig.label}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md">
          <div className="w-full h-3 bg-bg rounded-full overflow-hidden border border-border">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${percentage}%`, backgroundColor: '#B8860B' }}
            />
          </div>
          {nextLevelName && (
            <p className="text-sm text-muted mt-2 text-center">
              До уровня {nextLevelName}: осталось {formatNumber(gcToNext)} GC
            </p>
          )}
          {!nextLevelName && (
            <p className="text-sm text-muted mt-2 text-center">Максимальный уровень достигнут</p>
          )}
        </div>
      </div>

      {/* Shop button */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate('/gincoin/shop')}
          className="bg-gold hover:bg-gold-hover text-white rounded-lg px-6 py-3 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
        >
          <ShoppingBag size={20} />
          Обменять на продукцию
        </button>
      </div>
      </>}

      {/* Transaction history */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">История транзакций</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="text-left p-3 font-medium">Дата</th>
                <th className="text-left p-3 font-medium">Тип</th>
                <th className="text-right p-3 font-medium">Сумма</th>
                <th className="text-left p-3 font-medium">Описание</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border last:border-b-0 hover:bg-bg/50">
                  <td className="p-3 text-muted whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        tx.type === 'earn' ? 'bg-green/20 text-green' : 'bg-error/20 text-error'
                      }`}
                    >
                      {tx.type === 'earn' ? 'Начисление' : tx.type === 'spend' ? 'Расход' : 'Вывод'}
                    </span>
                  </td>
                  <td
                    className={`p-3 text-right font-semibold whitespace-nowrap ${
                      tx.type === 'earn' ? 'text-green' : 'text-error'
                    }`}
                  >
                    {tx.type === 'earn' ? '+' : '-'}
                    {formatNumber(Math.abs(tx.amount))}
                  </td>
                  <td className="p-3 text-muted">{tx.description}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted">
                    Транзакции не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {txTotalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-border">
            {Array.from({ length: txTotalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setTxPage(p)}
                className={`w-9 h-9 rounded-lg text-sm transition-colors cursor-pointer ${
                  txPage === p
                    ? 'bg-gold text-white'
                    : 'bg-bg border border-border text-muted hover:text-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
