import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../api/client';
import { formatNumber } from '../utils/format';
import { useAuthStore } from '../stores/authStore';
import Spinner from '../components/Spinner';
import GlassCard from '../components/GlassCard';

interface Manager {
  id: number;
  name: string;
  email: string;
  role: string;
  balance: number;
  total_earned: number;
  level: string;
  monthly_earned: number;
}

interface MyRank {
  rank: number;
}

const LEVEL_COLORS: Record<string, string> = {
  newcomer: '#888888',
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const LEVEL_KEYS: Record<string, string> = {
  newcomer: 'gincoin.newcomer',
  bronze: 'gincoin.bronze',
  silver: 'gincoin.silver',
  gold: 'gincoin.gold',
  platinum: 'gincoin.platinum',
};

const LEVEL_FILL_PCT: Record<string, number> = {
  newcomer: 20,
  bronze: 40,
  silver: 60,
  gold: 80,
  platinum: 100,
};

const TAB_KEYS = [
  { key: 'managers', labelKey: 'rating.managers' },
  { key: 'doctors', labelKey: 'rating.doctors' },
  { key: 'clinics', labelKey: 'rating.clinics' },
] as const;

type TabKey = (typeof TAB_KEYS)[number]['key'];

function MiniFlask({ level }: { level: string }) {
  const color = LEVEL_COLORS[level] || '#888888';
  const pct = LEVEL_FILL_PCT[level] || 20;
  // Flask viewBox 0 0 24 36, fill from bottom
  const fillHeight = (pct / 100) * 20; // liquid area is roughly 20 units tall (y=10 to y=30)
  const fillY = 30 - fillHeight;

  return (
    <svg viewBox="0 0 24 36" width="24" height="36" className="flex-shrink-0">
      <defs>
        <clipPath id={`miniFlask-${level}`}>
          <path d="M 8 4 L 8 10 Q 2 14 2 20 L 2 28 Q 2 30 4 30 L 20 30 Q 22 30 22 28 L 22 20 Q 22 14 16 10 L 16 4 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#miniFlask-${level})`}>
        <rect x="0" y={fillY} width="24" height={36 - fillY} fill={color} opacity="0.6" />
      </g>
      <path
        d="M 8 4 L 8 10 Q 2 14 2 20 L 2 28 Q 2 30 4 30 L 20 30 Q 22 30 22 28 L 22 20 Q 22 14 16 10 L 16 4 Z"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <rect x="7" y="2" width="10" height="3" rx="1" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

function RankBadge({ rank }: { rank: number }) {
  let bg = 'rgba(255,255,255,0.1)';
  let textColor = '#ffffff';
  if (rank === 1) {
    bg = 'linear-gradient(135deg, #B8860B, #FFD700)';
    textColor = '#000000';
  } else if (rank === 2) {
    bg = 'linear-gradient(135deg, #808080, #C0C0C0)';
    textColor = '#000000';
  } else if (rank === 3) {
    bg = 'linear-gradient(135deg, #8B5E3C, #CD7F32)';
    textColor = '#000000';
  }

  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{
        width: '28px',
        height: '28px',
        background: bg,
        color: textColor,
        fontSize: '12px',
        fontWeight: 700,
      }}
    >
      {rank}
    </div>
  );
}

function getRowStyle(rank: number): React.CSSProperties {
  if (rank === 1) return { background: 'rgba(255,215,0,0.1)', borderLeft: '3px solid #FFD700' };
  if (rank === 2) return { background: 'rgba(192,192,192,0.1)', borderLeft: '3px solid #C0C0C0' };
  if (rank === 3) return { background: 'rgba(205,127,50,0.1)', borderLeft: '3px solid #CD7F32' };
  return {};
}

export default function RatingPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<TabKey>('managers');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);

  useEffect(() => {
    if (tab === 'managers') {
      setLoading(true);
      Promise.all([
        api.get('/rating/managers').then(({ data }) => setManagers(data)),
        api.get('/rating/my').then(({ data }) => setMyRank(data)),
      ]).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold">{t('rating.title')}</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {TAB_KEYS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === tabItem.key
                ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white'
                : 'btn-secondary'
            }`}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {/* My position */}
      {tab === 'managers' && myRank && !loading && (
        <GlassCard
          tilt={false}
          className="p-4"
          style={{
            border: '2px solid rgba(184,134,11,0.5)',
            boxShadow: '0 0 20px rgba(184,134,11,0.15)',
          }}
        >
          <p className="text-sm text-muted">
            {t('rating.myPosition')}: <span className="text-gold font-bold text-lg">#{myRank.rank}</span>
          </p>
        </GlassCard>
      )}

      {/* Managers tab */}
      {tab === 'managers' && (loading ? <Spinner className="py-12" /> : (
        <GlassCard tilt={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3 font-medium w-16">#</th>
                  <th className="text-left p-3 font-medium">{t('rating.name')}</th>
                  <th className="text-right p-3 font-medium">{t('rating.monthGC')}</th>
                  <th className="text-right p-3 font-medium">{t('rating.totalGC')}</th>
                  <th className="text-left p-3 font-medium">{t('rating.level')}</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((m, idx) => {
                  const rank = idx + 1;
                  const isCurrentUser = user?.id === m.id;
                  return (
                    <tr
                      key={m.id}
                      className={`table-row-hover ${isCurrentUser ? 'ring-1 ring-gold/30' : ''}`}
                      style={getRowStyle(rank)}
                    >
                      <td className="p-3">
                        <RankBadge rank={rank} />
                      </td>
                      <td className="p-3 font-medium text-text">{m.name}</td>
                      <td className="p-3 text-right text-gold font-semibold">
                        {formatNumber(m.monthly_earned)}
                      </td>
                      <td className="p-3 text-right text-text">{formatNumber(m.total_earned)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <MiniFlask level={m.level} />
                          <span className="text-muted text-xs">
                            {t(LEVEL_KEYS[m.level] || 'gincoin.newcomer')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {managers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted">
                      {t('rating.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ))}

      {/* Doctors stub */}
      {tab === 'doctors' && (
        <GlassCard tilt={false} className="p-12 flex items-center justify-center">
          <p className="text-muted text-lg">{t('rating.comingSoon')}</p>
        </GlassCard>
      )}

      {/* Clinics stub */}
      {tab === 'clinics' && (
        <GlassCard tilt={false} className="p-12 flex items-center justify-center">
          <p className="text-muted text-lg">{t('rating.comingSoon')}</p>
        </GlassCard>
      )}
    </motion.div>
  );
}
