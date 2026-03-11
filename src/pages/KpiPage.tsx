import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  Flame,
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import Spinner from '../components/Spinner';
import { formatNumber } from '../utils/format';
import GlassCard from '../components/GlassCard';

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

function getProgressColor(pct: number): string {
  if (pct >= 100) return '#00D4AA';
  if (pct >= 50) return '#F1C40F';
  return '#E74C3C';
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
  index?: number;
}

function MetricCard({ label, actual, target, formatValue, suffix, index = 0 }: MetricCardProps) {
  const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
  const display = formatValue ? formatValue(actual) : formatNumber(actual);
  const targetDisplay = formatValue ? formatValue(target) : formatNumber(target);
  const color = getProgressColor(pct);

  return (
    <GlassCard tilt index={index} className="p-5">
      <p className="text-muted text-xs mb-1">{label}</p>
      <p className="text-lg font-semibold">
        {display}{suffix ?? ''} <span className="text-muted text-sm font-normal">/ {targetDisplay}{suffix ?? ''}</span>
      </p>
      <div className="mt-3 h-1.5 rounded-full bg-bg overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}4D`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className={`text-xs mt-1 ${progressTextColor(pct)}`}>{pct}%</p>
    </GlassCard>
  );
}

export default function KpiPage() {
  const { t } = useTranslation();
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
      addToast('error', t('kpi.loadError'));
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
        addToast('error', t('kpi.loadError'));
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
      addToast('error', t('kpi.managerLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async (type: IncrementType) => {
    setIncrementing(type);
    try {
      await api.post('/kpi/increment', { type });
      addToast('success', t('kpi.recorded'));
      await fetchKpi(isAdmin && selectedManagerId ? selectedManagerId : undefined);
    } catch {
      addToast('error', t('kpi.recordError'));
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
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="space-y-6"
      >
        <GlassCard tilt={false} className="p-8 text-center">
          <p className="text-muted">{t('kpi.noData')}</p>
        </GlassCard>
      </motion.div>
    );
  }

  const targets = kpi.targets;
  const a = kpi.actuals;
  const gc = kpi.gincoin_breakdown;

  const metrics = [
    { label: t('kpi.revenue'), actual: a.revenue, target: targets.revenue ?? 600000, formatValue: (v: number) => `₴ ${formatNumber(v)}` },
    { label: t('kpi.avgCheck'), actual: a.avg_check, target: targets.avg_check ?? 11000, formatValue: (v: number) => `₴ ${formatNumber(v)}` },
    { label: t('kpi.retention'), actual: targets.retention ? Math.round((a.orders_count / (targets.retention * 4)) * 100) : 0, target: targets.retention ?? 25, suffix: '%' },
    { label: t('kpi.meetings'), actual: a.meetings, target: targets.meetings ?? 15 },
    { label: t('kpi.calls'), actual: a.calls, target: targets.calls_per_day ? targets.calls_per_day * 22 : 220 },
    { label: t('kpi.seminars'), actual: a.seminars, target: targets.seminars ?? 3 },
    { label: t('kpi.leadsAndDoctors'), actual: a.leads, target: targets.leads ?? 10 },
    { label: t('kpi.streak'), actual: a.streak_weeks, target: targets.streak ?? 4, suffix: ' ' + t('kpi.weeks') },
  ];

  const overallPct = Math.round(
    metrics.reduce((sum, m) => {
      const pct = m.target > 0 ? Math.min((m.actual / m.target) * 100, 100) : 0;
      return sum + pct;
    }, 0) / metrics.length
  );

  const overallColor = getProgressColor(overallPct);

  const counterButtons: { label: string; type: IncrementType; icon: typeof Phone }[] = [
    { label: t('kpi.addMeeting'), type: 'meeting', icon: Users },
    { label: t('kpi.addCall'), type: 'call', icon: Phone },
    { label: t('kpi.addSeminar'), type: 'seminar', icon: Presentation },
    { label: t('kpi.addLead'), type: 'lead', icon: UserPlus },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Admin tabs */}
      {isAdmin && managers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {managers.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelectManager(m.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                selectedManagerId === m.id
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white'
                  : 'btn-secondary'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* Overall progress */}
      <GlassCard tilt={false} className="p-6 flex items-center gap-5">
        <div className="p-3 rounded-lg bg-bg text-gold">
          <Target size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-muted text-xs mb-1">{t('kpi.overallProgress')} — {kpi.user_name}</p>
          <div className="flex items-center gap-3">
            <p className={`text-3xl font-bold ${progressTextColor(overallPct)}`}>{overallPct}%</p>
            {a.streak_weeks > 0 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center gap-1"
              >
                <Flame size={20} className="text-orange-500" />
                <span className="text-sm font-semibold text-orange-400">{a.streak_weeks} {t('kpi.weeks')}</span>
              </motion.div>
            )}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-bg overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: overallColor,
                boxShadow: `0 0 8px ${overallColor}4D`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(overallPct, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-muted mt-1">
            {t('kpi.period')}: {new Date(kpi.period_start).toLocaleDateString('ru-RU')} — {new Date(kpi.period_end).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </GlassCard>

      {/* Counter buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {counterButtons.map((btn) => (
          <motion.button
            key={btn.type}
            onClick={() => handleIncrement(btn.type)}
            disabled={incrementing !== null}
            whileTap={{ scale: 0.95 }}
            className="rounded-full px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            style={{
              background: 'rgba(0,212,170,0.12)',
              border: '1px solid rgba(0,212,170,0.3)',
              color: '#00D4AA',
            }}
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
          </motion.button>
        ))}
      </div>

      {/* KPI metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard
            key={m.label}
            label={m.label}
            actual={m.actual}
            target={m.target}
            formatValue={m.formatValue}
            suffix={m.suffix}
            index={i}
          />
        ))}
      </div>

      {/* GinCoin breakdown */}
      <GlassCard tilt={false} className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-bg text-gold">
            <Coins size={22} />
          </div>
          <h2 className="text-base font-semibold">{t('kpi.gincoinEarned')}</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">{t('kpi.leads')} <span className="text-xs">{t('kpi.leadsGCDesc')}</span></span>
            <span>{formatNumber(gc.leads)} GC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('kpi.meetings')} <span className="text-xs">{t('kpi.meetingsGCDesc')}</span></span>
            <span>{formatNumber(gc.meetings)} GC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('kpi.seminars')} <span className="text-xs">{t('kpi.seminarsGCDesc')}</span></span>
            <span>{formatNumber(gc.seminars)} GC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t('kpi.streak')} <span className="text-xs">{t('kpi.streakGCDesc')}</span></span>
            <span>{formatNumber(gc.streak)} GC</span>
          </div>
          <div className="border-t border-white/5 pt-3 flex justify-between">
            <span className="font-bold">{t('kpi.total')}</span>
            <span className="font-bold text-gold">{formatNumber(gc.total)} GC</span>
          </div>
        </div>

        {/* Warnings */}
        {a.meetings < 15 && (
          <div className="mt-4 flex items-center gap-2 text-error text-sm">
            <AlertTriangle size={16} />
            <span>{t('kpi.warningMeetings')}</span>
          </div>
        )}
        {a.seminars <= 2 && (
          <div className="mt-2 flex items-center gap-2 text-error text-sm">
            <AlertTriangle size={16} />
            <span>{t('kpi.warningSeminars')}</span>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
