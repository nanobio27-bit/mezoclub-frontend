import { useTranslation } from 'react-i18next';
import { Coins, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface HeaderProps {
  title: string;
  collapsed: boolean;
}

export default function Header({ title, collapsed }: HeaderProps) {
  const { i18n } = useTranslation();
  const { user } = useAuthStore();

  const toggleLang = () => {
    const next = i18n.language === 'ru' ? 'uk' : 'ru';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <header
      className="h-16 bg-card border-b border-border flex items-center justify-between px-6 fixed top-0 right-0 z-40 transition-all"
      style={{ left: collapsed ? 64 : 260 }}
    >
      <h2 className="text-lg font-semibold text-text">{title}</h2>

      <div className="flex items-center gap-5">
        {/* GinCoin balance */}
        <div className="flex items-center gap-1.5 text-gold">
          <Coins size={18} />
          <span className="text-sm font-medium">0</span>
        </div>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="text-xs font-medium text-muted hover:text-text border border-border rounded-md px-2 py-1 transition-colors cursor-pointer uppercase"
        >
          {i18n.language}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted hidden sm:block">{user?.name || 'User'}</span>
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
            <User size={16} className="text-gold" />
          </div>
        </div>
      </div>
    </header>
  );
}
