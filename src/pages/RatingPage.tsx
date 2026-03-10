import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import { formatNumber } from '../utils/format';
import { useAuthStore } from '../stores/authStore';
import Spinner from '../components/Spinner';

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

const LEVEL_LABELS: Record<string, string> = {
  newcomer: 'Новичок',
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
  platinum: 'Платина',
};

const TABS = [
  { key: 'managers', label: 'Менеджеры' },
  { key: 'doctors', label: 'Врачи' },
  { key: 'clinics', label: 'Клиники' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function RatingPage() {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-bold">Рейтинг</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === t.key
                ? 'bg-gold text-white'
                : 'bg-card border border-border text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Managers tab */}
      {tab === 'managers' && (loading ? <Spinner className="py-12" /> : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {myRank && (
            <div className="p-4 border-b border-border">
              <p className="text-sm text-muted">
                Ваша позиция: <span className="text-gold font-bold">#{myRank.rank}</span>
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="text-left p-3 font-medium w-16">#</th>
                  <th className="text-left p-3 font-medium">Имя</th>
                  <th className="text-right p-3 font-medium">GinCoin/мес</th>
                  <th className="text-right p-3 font-medium">GinCoin всего</th>
                  <th className="text-left p-3 font-medium">Уровень</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((m, idx) => {
                  const isCurrentUser = user?.id === m.id;
                  return (
                    <tr
                      key={m.id}
                      className={`border-b border-border last:border-b-0 hover:bg-bg/50 ${
                        isCurrentUser ? 'border-l-2 border-l-gold bg-gold/5' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-muted">{idx + 1}</td>
                      <td className="p-3 font-medium text-text">{m.name}</td>
                      <td className="p-3 text-right text-gold font-semibold">
                        {formatNumber(m.monthly_earned)}
                      </td>
                      <td className="p-3 text-right text-text">{formatNumber(m.total_earned)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: LEVEL_COLORS[m.level] || '#888888' }}
                          />
                          <span className="text-muted text-xs">
                            {LEVEL_LABELS[m.level] || m.level}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {managers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted">
                      Данные не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Doctors stub */}
      {tab === 'doctors' && (
        <div className="bg-card rounded-xl border border-border p-12 flex items-center justify-center">
          <p className="text-muted text-lg">Скоро</p>
        </div>
      )}

      {/* Clinics stub */}
      {tab === 'clinics' && (
        <div className="bg-card rounded-xl border border-border p-12 flex items-center justify-center">
          <p className="text-muted text-lg">Скоро</p>
        </div>
      )}
    </motion.div>
  );
}
