import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Plus,
  Phone,
  Users,
  Presentation,
  UserPlus,
  Coins,
  AlertTriangle,
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import Spinner from '../components/Spinner';
import { formatNumber } from '../utils/format';

interface KpiActuals {
  revenue: number;
  avg_check: number;
  orders_count: number;
  meetings: number;
  calls: number;
  seminars: number;
  leads: number;
  streak_weeks: number;
}

interface GincoinBreakdown {
  leads: number;
  meetings: number;
  seminars: number;
  streak: number;
  total: number;
}

interface KpiSummary {
  user_id: number;
  user_name: string;
  period_start: string;
  period_end: string;
  targets: Record<string, number>;
  actuals: KpiActuals;
  gincoin_breakdown: GincoinBreakdown;
}

interface Manager {
  id: number;
  name: string;
  email: string;
  role: string;
}

type IncrementType = 'meeting' | 'call' | 'seminar' | 'lead';

function progressColor(pct: number): string {
  if (pct >= 100) return 'bg-green';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-error';
}

function progressTextColor(pct: number): string {
  if (pct >= 100) return 'text-green';
  if (pct >= 50) return 'text-yellow-500';
  return 'text-error';
}

interface MetricCardProps {
  label: string;
  actual: number;
  target: number;
  formatValue?: (v: number) => string;
  suffix?: string;
}

function MetricCard({ label, actual, target, formatValue, suffix }: MetricCardProps) {
  const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
  const display = formatValue ? formatValue(actual) : formatNumber(actual);
  const targetDisplay = formatValue ? formatValue(target) : formatNumber(target);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <p className="text-muted text-xs mb-1">{label}</p>
      <p className="text-lg font-semibold">
        {display}{suffix ?? ''} <span className="text-muted text-sm font-normal">/ {targetDisplay}{suffix ?? ''}</span>
      </p>
      <div className="mt-3 h-2 rounded-full bg-bg overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${progressColor(pct)}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className={`text-xs mt-1 ${progressTextColor(pct)}`}>{pct}%</p>
    </div>
  );
}

export default function KpiPage() {
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const isAdmin = user?.role === 'admin';

  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [incrementing, setIncrementing] = useState<IncrementType | null>(null);

  const fetchKpi = useCallback(async (managerId?: number) => {
    try {
      if (isAdmin && managerId) {
        const { data } = await api.get<KpiSummary>(`/kpi/user/${managerId}`);
        setKpi(data);
      } else {
        const { data } = await api.get<KpiSummary>('/kpi/my');
        setKpi(data);
      }
    } catch (err) {
      console.error('KPI fetch error:', err);
      addToast('error', 'Ошибка загрузки KPI');
    }
  }, [isAdmin, addToast]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        if (isAdmin) {
          const { data: mgrs } = await api.get<Manager[]>('/kpi/managers');
          setManagers(mgrs);
          if (mgrs.length > 0) {
            setSelectedManagerId(mgrs[0].id);
            const { data } = await api.get<KpiSummary>(`/kpi/user/${mgrs[0].id}`);
            setKpi(data);
          }
        } else {
          await fetchKpi();
        }
      } catch (err) {
        console.error('KPI init error:', err);
        addToast('error', 'Ошибка загрузки KPI');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [isAdmin, fetchKpi, addToast]);

  const handleSelectManager = async (id: number) => {
    setSelectedManagerId(id);
    setLoading(true);
    try {
      const { data } = await api.get<KpiSummary>(`/kpi/user/${id}`);
      setKpi(data);
    } catch {
      addToast('error', 'Ошибка загрузки KPI менеджера');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async (type: IncrementType) => {
    setIncrementing(type);
    try {
      await api.post('/kpi/increment', { type });
      addToast('success', 'Записано!');
      await fetchKpi(isAdmin && selectedManagerId ? selectedManagerId : undefined);
    } catch {
      addToast('error', 'Ошибка записи');
    } finally {
      setIncrementing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!kpi) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted">Нет данных KPI</p>
        </div>
      </motion.div>
    );
  }

  const targets = kpi.targets;
  const a = kpi.actuals;
  const gc = kpi.gincoin_breakdown;

  const metrics = [
    { label: 'Выручка', actual: a.revenue, target: targets.revenue ?? 600000, formatValue: (v: number) => `₴ ${formatNumber(v)}` },
    { label: 'Средний чек', actual: a.avg_check, target: targets.avg_check ?? 11000, formatValue: (v: number) => `₴ ${formatNumber(v)}` },
    { label: 'Retention Rate', actual: targets.retention ? Math.round((a.orders_count / (targets.retention * 4)) * 100) : 0, target: targets.retention ?? 25, suffix: '%' },
    { label: 'Встречи', actual: a.meetings, target: targets.meetings ?? 15 },
    { label: 'Звонки', actual: a.calls, target: targets.calls_per_day ? targets.calls_per_day * 22 : 220 },
    { label: 'Семинары', actual: a.seminars, target: targets.seminars ?? 3 },
    { label: 'Лиды / Привлечённые врачи', actual: a.leads, target: targets.leads ?? 10 },
    { label: 'Серия', actual: a.streak_weeks, target: targets.streak ?? 4, suffix: ' нед.' },
  ];

  const overallPct = Math.round(
    metrics.reduce((sum, m) => {
      const pct = m.target > 0 ? Math.min((m.actual / m.target) * 100, 100) : 0;
      return sum + pct;
    }, 0) / metrics.length
  );

  const counterButtons: { label: string; type: IncrementType; icon: typeof Phone }[] = [
    { label: '+ Встреча', type: 'meeting', icon: Users },
    { label: '+ Звонок', type: 'call', icon: Phone },
    { label: '+ Семинар', type: 'seminar', icon: Presentation },
    { label: '+ Лид', type: 'lead', icon: UserPlus },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Admin tabs */}
      {isAdmin && managers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {managers.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelectManager(m.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedManagerId === m.id
                  ? 'bg-gold text-bg'
                  : 'bg-card border border-border text-muted hover:text-text'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* Overall progress */}
      <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-5">
        <div className="p-3 rounded-lg bg-bg text-gold">
          <Target size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-muted text-xs mb-1">Общий прогресс KPI — {kpi.user_name}</p>
          <p className={`text-3xl font-bold ${progressTextColor(overallPct)}`}>{overallPct}%</p>
          <div className="mt-2 h-3 rounded-full bg-bg overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${progressColor(overallPct)}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(overallPct, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-muted mt-1">
            Период: {new Date(kpi.period_start).toLocaleDateString('ru-RU')} — {new Date(kpi.period_end).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </div>

      {/* Counter buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {counterButtons.map((btn) => (
          <button
            key={btn.type}
            onClick={() => handleIncrement(btn.type)}
            disabled={incrementing !== null}
            className="bg-card rounded-xl border border-border p-4 flex items-center justify-center gap-2 text-sm font-medium hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
          >
            {incrementing === btn.type ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Plus size={16} />
                <btn.icon size={16} />
                <span>{btn.label}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* KPI metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard
            key={m.label}
            label={m.label}
            actual={m.actual}
            target={m.target}
            formatValue={m.formatValue}
            suffix={m.suffix}
          />
        ))}
      </div>

      {/* GinCoin breakdown */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-bg text-gold">
            <Coins size={22} />
          </div>
          <h2 className="text-base font-semibold">GinCoin за KPI</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Лиды <span className="text-xs">(200 GC за каждые 10 лидов)</span></span>
            <span>{formatNumber(gc.leads)} GC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Встречи <span className="text-xs">(100 GC каждая, 0 если &lt;15)</span></span>
            <span>{formatNumber(gc.meetings)} GC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Семинары <span className="text-xs">(500 GC каждый, 0 если &le;2)</span></span>
            <span>{formatNumber(gc.seminars)} GC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Серия <span className="text-xs">(200 GC за неделю)</span></span>
            <span>{formatNumber(gc.streak)} GC</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-bold">Итого</span>
            <span className="font-bold text-gold">{formatNumber(gc.total)} GC</span>
          </div>
        </div>

        {/* Warnings */}
        {a.meetings < 15 && (
          <div className="mt-4 flex items-center gap-2 text-error text-sm">
            <AlertTriangle size={16} />
            <span>Встречи сгорают — менее 15 за месяц</span>
          </div>
        )}
        {a.seminars <= 2 && (
          <div className="mt-2 flex items-center gap-2 text-error text-sm">
            <AlertTriangle size={16} />
            <span>Семинары не засчитаны — нужно более 2</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
