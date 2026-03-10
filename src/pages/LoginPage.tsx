import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold tracking-wide">MezoClub</h1>
          <p className="text-muted mt-2 text-sm">CRM System</p>
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-muted mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
                placeholder="admin@mezoclub.com"
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-error text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gold hover:bg-gold-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? '...' : t('auth.login')}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
