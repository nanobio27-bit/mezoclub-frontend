import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag } from 'lucide-react';
import api from '../api/client';
import { formatNumber } from '../utils/format';
import Spinner from '../components/Spinner';
import GlassCard from '../components/GlassCard';

function playCoinSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 200);
  } catch {
    // Audio not available
  }
}

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

const LEVEL_CONFIG: Record<string, { color: string; labelKey: string; next: number; min: number }> = {
  newcomer: { color: '#888888', labelKey: 'gincoin.newcomer', next: 1000, min: 0 },
  bronze: { color: '#CD7F32', labelKey: 'gincoin.bronze', next: 5000, min: 1000 },
  silver: { color: '#C0C0C0', labelKey: 'gincoin.silver', next: 15000, min: 5000 },
  gold: { color: '#FFD700', labelKey: 'gincoin.gold', next: 50000, min: 15000 },
  platinum: { color: '#E5E4E2', labelKey: 'gincoin.platinum', next: 50000, min: 50000 },
};

const LEVEL_GRADIENTS: Record<string, string> = {
  newcomer: 'linear-gradient(90deg, #888888, #aaaaaa)',
  bronze: 'linear-gradient(90deg, #CD7F32, #E8A849)',
  silver: 'linear-gradient(90deg, #C0C0C0, #E0E0E0)',
  gold: 'linear-gradient(90deg, #B8860B, #FFD700)',
  platinum: 'linear-gradient(90deg, #E5E4E2, #FFFFFF)',
};

const LEVEL_GLOW: Record<string, string> = {
  newcomer: 'none',
  bronze: 'drop-shadow(0 0 15px rgba(205,127,50,0.2))',
  silver: 'drop-shadow(0 0 20px rgba(192,192,192,0.2))',
  gold: 'drop-shadow(0 0 40px rgba(255,215,0,0.2))',
  platinum: 'drop-shadow(0 0 60px rgba(229,228,226,0.3))',
};

function getLevelProgress(level: string, totalEarned: number): number {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.newcomer;
  if (level === 'platinum') return 100;
  const range = config.next - config.min;
  if (range <= 0) return 100;
  const progress = ((totalEarned - config.min) / range) * 100;
  return Math.max(0, Math.min(100, progress));
}

function getNextLevelKey(level: string): string | null {
  const order = ['newcomer', 'bronze', 'silver', 'gold', 'platinum'];
  const idx = order.indexOf(level);
  if (idx < 0 || idx >= order.length - 1) return null;
  return LEVEL_CONFIG[order[idx + 1]].labelKey;
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

  const fillRange = 250;
  const fillY = 275 - (percentage / 100) * fillRange;

  const waveY = fillY;
  const waveD = `M 0 ${waveY + 5} Q 30 ${waveY - 5} 60 ${waveY + 5} Q 90 ${waveY + 15} 120 ${waveY + 5} Q 150 ${waveY - 5} 180 ${waveY + 5} Q 200 ${waveY + 15} 220 ${waveY + 5} L 220 300 L 0 300 Z`;

  const bubbles = [
    { cx: 60, r: 3, dur: '3s', delay: '0s' },
    { cx: 100, r: 2, dur: '2.5s', delay: '0.5s' },
    { cx: 140, r: 4, dur: '4s', delay: '1s' },
    { cx: 80, r: 2, dur: '3.5s', delay: '1.5s' },
    { cx: 120, r: 3, dur: '2.8s', delay: '0.3s' },
    { cx: 90, r: 2, dur: '5s', delay: '2s' },
    { cx: 150, r: 3, dur: '4.5s', delay: '0.8s' },
  ];

  const glowFilter = LEVEL_GLOW[level] || 'none';

  const svgContent = (
    <svg
      viewBox="0 0 200 300"
      className="w-48 h-72"
      style={{ filter: glowFilter }}
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

        {/* Bubbles */}
        {percentage > 5 && bubbles.map((b, i) => (
          <circle key={i} cx={b.cx} r={b.r} fill="rgba(255,255,255,0.4)">
            <animate
              attributeName="cy"
              from="275"
              to={String(fillY)}
              dur={b.dur}
              begin={b.delay}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;0.2;0.6"
              dur={b.dur}
              begin={b.delay}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>

      {/* Flask outline */}
      <path
        d="M 70 20 L 70 80 Q 20 120 20 180 L 20 260 Q 20 280 40 280 L 160 280 Q 180 280 180 260 L 180 180 Q 180 120 130 80 L 130 20 Z"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="3"
      />
      {/* Handle (arc on the right side) */}
      <path
        d="M 135 30 Q 165 30 165 55 Q 165 80 135 80"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Flask cap */}
      <rect x="65" y="10" width="70" height="15" rx="4" fill="rgba(255,255,255,0.2)" />
    </svg>
  );

  if (isPlatinum) {
    return (
      <div className="relative flex justify-center">
        <motion.div
          animate={{
            filter: [
              'drop-shadow(0 0 60px rgba(229,228,226,0.3))',
              'drop-shadow(0 0 80px rgba(229,228,226,0.6))',
              'drop-shadow(0 0 60px rgba(229,228,226,0.3))',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {svgContent}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex justify-center">
      {svgContent}
    </div>
  );
}

export default function GinCoinPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const txLimit = 10;
  const prevEarnedRef = useRef<number | null>(null);

  useEffect(() => {
    api.get('/gincoin/balance').then(({ data }) => {
      const newEarned = parseFloat(data.total_earned) || 0;
      if (prevEarnedRef.current !== null && newEarned > prevEarnedRef.current) {
        playCoinSound();
      }
      prevEarnedRef.current = newEarned;
      setBalance(data);
      setLoading(false);
    }).catch(() => { setLoading(false); });
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
  const nextLevelKey = getNextLevelKey(level);
  const gcToNext = getGCToNextLevel(level, totalEarned);
  const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG.newcomer;

  const txTotalPages = Math.ceil(txTotal / txLimit);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-8"
    >
      <h1 className="text-2xl font-bold">{t('gincoin.title')}</h1>

      {loading ? <Spinner className="py-12" /> : <>
      {/* Flask section */}
      <GlassCard tilt={false} className="flex flex-col items-center gap-6 p-8">
        <FlaskSVG level={level} percentage={percentage} />

        {/* Balance */}
        <p
          style={{
            fontSize: '36px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #B8860B, #FFD700)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {formatNumber(currentBalance)} GinCoin = {formatNumber(currentBalance)} ₴
        </p>

        {/* Level badge */}
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: levelConfig.color }}
          />
          <span className="font-semibold text-text">{t(levelConfig.labelKey)}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md">
          <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: LEVEL_GRADIENTS[level] || LEVEL_GRADIENTS.newcomer }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          {nextLevelKey && (
            <p className="text-sm text-muted mt-2 text-center">
              {t('gincoin.toLevel', { level: t(nextLevelKey!), amount: formatNumber(gcToNext) })}
            </p>
          )}
          {!nextLevelKey && (
            <p className="text-sm text-muted mt-2 text-center">{t('gincoin.maxLevel')}</p>
          )}
        </div>
      </GlassCard>

      {/* Shop button */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate('/gincoin/shop')}
          className="btn-primary flex items-center gap-2"
        >
          <ShoppingBag size={20} />
          {t('gincoin.exchange')}
        </button>
      </div>
      </>}

      {/* Transaction history */}
      <GlassCard tilt={false} className="overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-bold text-lg">{t('gincoin.history')}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3 font-medium">{t('gincoin.date')}</th>
                <th className="text-left p-3 font-medium">{t('gincoin.type')}</th>
                <th className="text-right p-3 font-medium">{t('gincoin.sum')}</th>
                <th className="text-left p-3 font-medium">{t('gincoin.description')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="table-row-hover">
                  <td className="p-3 text-muted whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        tx.type === 'earn' ? 'bg-green/20 text-green' : 'bg-error/20 text-error'
                      }`}
                    >
                      {tx.type === 'earn' ? t('gincoin.earned') : tx.type === 'spend' ? t('gincoin.spent') : t('gincoin.withdrawType')}
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
                    {t('gincoin.txNotFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {txTotalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-white/5">
            {Array.from({ length: txTotalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setTxPage(p)}
                className={`w-9 h-9 rounded-lg text-sm transition-colors cursor-pointer ${
                  txPage === p
                    ? 'text-white'
                    : 'bg-bg border border-border text-muted hover:text-text'
                }`}
                style={txPage === p ? { background: 'linear-gradient(135deg, #136579, #1a8a9e)' } : undefined}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
