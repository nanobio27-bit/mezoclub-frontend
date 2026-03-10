import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-8xl font-bold text-gold mb-4">404</h1>
        <p className="text-xl text-text mb-2">Страница не найдена</p>
        <p className="text-muted mb-8">Запрашиваемая страница не существует или была удалена</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gold hover:bg-gold-hover text-white rounded-lg px-6 py-3 transition-colors cursor-pointer font-semibold"
        >
          На главную
        </button>
      </motion.div>
    </div>
  );
}
