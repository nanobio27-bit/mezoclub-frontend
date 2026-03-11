import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Save, Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import Spinner from '../components/Spinner';
import { formatNumber } from '../utils/format';

// --------------- Types ---------------

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Manager {
  id: number;
  name: string;
}

interface Target {
  metric: string;
  target_value: number;
}

type TabKey = 'profile' | 'users' | 'kpi';

const METRIC_KEYS: Record<string, string> = {
  revenue: 'settings.metricRevenue',
  avg_check: 'settings.metricAvgCheck',
  retention: 'settings.metricRetention',
  calls_per_day: 'settings.metricCalls',
  meetings_target: 'settings.metricMeetings',
  seminars_target: 'settings.metricSeminars',
  leads_target: 'settings.metricLeads',
};

const DEFAULT_METRICS = Object.keys(METRIC_KEYS);

const ROLE_KEYS: Record<string, string> = {
  admin: 'settings.admin',
  manager: 'settings.manager',
  dealer: 'settings.dealer',
};

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-gold/20 text-gold',
  manager: 'bg-blue-500/20 text-blue-400',
  dealer: 'bg-green/20 text-green',
};

// --------------- Component ---------------

export default function SettingsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const tabs: { key: TabKey; label: string; adminOnly?: boolean }[] = [
    { key: 'profile', label: t('settings.profile') },
    { key: 'users', label: t('settings.users'), adminOnly: true },
    { key: 'kpi', label: t('settings.kpiTargets'), adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-1 bg-card rounded-xl border border-border p-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-gold text-bg'
                : 'text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' && <ProfileTab key="profile" />}
        {activeTab === 'users' && isAdmin && <UsersTab key="users" />}
        {activeTab === 'kpi' && isAdmin && <KpiTargetsTab key="kpi" />}
      </AnimatePresence>
    </motion.div>
  );
}

// ===================== PROFILE TAB =====================

function ProfileTab() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('error', t('settings.passwordMismatch'));
      return;
    }
    if (newPassword.length < 4) {
      addToast('error', t('settings.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      addToast('success', t('settings.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        t('settings.passwordChangeError');
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6"
    >
      {/* User info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-text mb-4">{t('settings.info')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted">{t('settings.name')}</span>
            <p className="text-text font-medium">{user?.name ?? '—'}</p>
          </div>
          <div>
            <span className="text-sm text-muted">Email</span>
            <p className="text-text font-medium">{user?.email ?? '—'}</p>
          </div>
          <div>
            <span className="text-sm text-muted">{t('settings.role')}</span>
            <p className="text-text font-medium">{t(ROLE_KEYS[user?.role ?? '']) ?? user?.role}</p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text">{t('settings.changePassword')}</h2>

        <div>
          <label className="block text-sm text-muted mb-1">{t('settings.currentPassword')}</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-gold pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">{t('settings.newPassword')}</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-gold pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">{t('settings.confirmPassword')}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-gold"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-gold text-bg px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Spinner size="sm" /> : <Save size={16} />}
          {t('common.save')}
        </button>
      </form>
    </motion.div>
  );
}

// ===================== USERS TAB =====================

function UsersTab() {
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Add form state
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState('manager');
  const [addLoading, setAddLoading] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch {
      addToast('error', t('settings.usersLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.post('/auth/users', {
        name: addName,
        email: addEmail,
        password: addPassword,
        role: addRole,
      });
      addToast('success', t('settings.userCreated'));
      setShowAddForm(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddRole('manager');
      await fetchUsers();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        t('settings.userCreateError');
      addToast('error', message);
    } finally {
      setAddLoading(false);
    }
  };

  const startEdit = (u: UserRecord) => {
    setEditingId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditActive(u.is_active);
  };

  const handleEdit = async (id: number) => {
    setEditLoading(true);
    try {
      await api.put(`/auth/users/${id}`, {
        name: editName,
        email: editEmail,
        role: editRole,
        is_active: editActive,
      });
      addToast('success', t('settings.userUpdated'));
      setEditingId(null);
      await fetchUsers();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        t('settings.userUpdateError');
      addToast('error', message);
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return <Spinner className="py-12" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{t('settings.users')} ({formatNumber(users.length)})</h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
          }}
          className="bg-gold text-bg px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? t('common.cancel') : t('common.add')}
        </button>
      </div>

      {/* Add user form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="bg-card rounded-xl border border-border p-5 space-y-4 overflow-hidden"
          >
            <h3 className="text-sm font-semibold text-text">{t('settings.newUser')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">{t('settings.name')}</label>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Email</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  required
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">{t('settings.password')}</label>
                <input
                  type="password"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  required
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">{t('settings.role')}</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-gold"
                >
                  <option value="admin">{t('settings.admin')}</option>
                  <option value="manager">{t('settings.manager')}</option>
                  <option value="dealer">{t('settings.dealer')}</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="bg-gold text-bg px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {addLoading ? <Spinner size="sm" /> : <Plus size={16} />}
              {t('common.create')}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Users table */}
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="text-left px-4 py-3 font-medium">{t('settings.name')}</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">{t('settings.role')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('settings.status')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('settings.createdAt')}</th>
              <th className="text-right px-4 py-3 font-medium">{t('settings.action')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) =>
              editingId === u.id ? (
                <tr key={u.id} className="border-b border-border bg-bg/50">
                  <td className="px-4 py-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-bg border border-border rounded px-2 py-1 text-text text-sm focus:outline-none focus:border-gold"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-bg border border-border rounded px-2 py-1 text-text text-sm focus:outline-none focus:border-gold"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="bg-bg border border-border rounded px-2 py-1 text-text text-sm focus:outline-none focus:border-gold"
                    >
                      <option value="admin">{t('settings.admin')}</option>
                      <option value="manager">{t('settings.manager')}</option>
                      <option value="dealer">{t('settings.dealer')}</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                        className="accent-gold w-4 h-4"
                      />
                      <span className="text-sm text-text">{editActive ? t('common.active') : t('common.inactive')}</span>
                    </label>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {new Date(u.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => void handleEdit(u.id)}
                      disabled={editLoading}
                      className="text-green hover:opacity-80 text-sm font-medium disabled:opacity-50"
                    >
                      {editLoading ? '...' : t('common.save')}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-muted hover:text-text text-sm"
                    >
                      {t('common.cancel')}
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className="border-b border-border hover:bg-bg/30 transition-colors">
                  <td className="px-4 py-3 text-text font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] ?? 'bg-border text-muted'}`}
                    >
                      {t(ROLE_KEYS[u.role]) ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-green' : 'bg-error'}`}
                      />
                      <span className="text-muted text-sm">
                        {u.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(u.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(u)}
                      className="text-gold hover:opacity-80 text-sm font-medium"
                    >
                      {t('common.change')}
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ===================== KPI TARGETS TAB =====================

function KpiTargetsTab() {
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/kpi/managers');
        setManagers(data);
      } catch {
        addToast('error', t('settings.managersLoadError'));
      } finally {
        setLoadingManagers(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedManager === null) return;

    const load = async () => {
      setLoadingTargets(true);
      try {
        const { data } = await api.get(`/kpi/targets/${selectedManager}`);
        const map: Record<string, number> = {};
        for (const m of DEFAULT_METRICS) {
          map[m] = 0;
        }
        for (const t of data as Target[]) {
          map[t.metric] = t.target_value;
        }
        setTargets(map);
      } catch {
        addToast('error', t('settings.targetsLoadError'));
      } finally {
        setLoadingTargets(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedManager]);

  const handleSaveAll = async () => {
    if (selectedManager === null) return;
    setSaving(true);
    try {
      const promises = DEFAULT_METRICS.map((metric) =>
        api.put(`/kpi/targets/${selectedManager}`, {
          metric,
          target_value: targets[metric] ?? 0,
        }),
      );
      await Promise.all(promises);
      addToast('success', t('settings.targetsSaved'));
    } catch {
      addToast('error', t('settings.targetsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loadingManagers) {
    return <Spinner className="py-12" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-4"
    >
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text">{t('settings.kpiTargetsTitle')}</h2>

        <div>
          <label className="block text-sm text-muted mb-1">{t('settings.manager')}</label>
          <select
            value={selectedManager ?? ''}
            onChange={(e) => setSelectedManager(e.target.value ? Number(e.target.value) : null)}
            className="w-full sm:w-72 bg-bg border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-gold"
          >
            <option value="">{t('settings.selectManager')}</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedManager !== null && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loadingTargets ? (
            <Spinner className="py-12" />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="text-left px-4 py-3 font-medium">{t('settings.metric')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('settings.targetValue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_METRICS.map((metric) => (
                    <tr key={metric} className="border-b border-border">
                      <td className="px-4 py-3 text-text">{t(METRIC_KEYS[metric])}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={targets[metric] ?? 0}
                          onChange={(e) =>
                            setTargets((prev) => ({
                              ...prev,
                              [metric]: Number(e.target.value),
                            }))
                          }
                          min={0}
                          className="w-40 bg-bg border border-border rounded-lg px-3 py-1.5 text-text text-sm focus:outline-none focus:border-gold"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-4 py-4 border-t border-border">
                <button
                  onClick={() => void handleSaveAll()}
                  disabled={saving}
                  className="bg-gold text-bg px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Spinner size="sm" /> : <Save size={16} />}
                  {t('settings.saveAll')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
