import { motion } from 'framer-motion';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 20, md: 32, lg: 48 };
  const s = sizes[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: s,
          height: s,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #136579, #1a8a9e)',
          boxShadow: '0 0 20px rgba(19,101,121,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: s * 0.45,
          fontWeight: 800,
          color: '#fff',
        }}
      >
        G
      </motion.div>
    </div>
  );
}
