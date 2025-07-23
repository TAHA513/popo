import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUPPORTER_LEVELS } from './SupporterBadge';

interface SupporterLevelUpNotificationProps {
  isVisible: boolean;
  newLevel: number;
  oldLevel: number;
  onComplete: () => void;
}

export function SupporterLevelUpNotification({ 
  isVisible, 
  newLevel, 
  oldLevel, 
  onComplete 
}: SupporterLevelUpNotificationProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  
  const newLevelConfig = SUPPORTER_LEVELS[newLevel];
  const isArabic = document.documentElement.lang === 'ar';
  
  useEffect(() => {
    if (isVisible) {
      setShowCelebration(true);
      
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setShowCelebration(false);
        onComplete();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Main notification */}
          <motion.div
            className="relative bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Confetti animation */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              {Array.from({ length: 30 }, (_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                  style={{
                    left: Math.random() * 100 + '%',
                    top: -10
                  }}
                  animate={{
                    y: [0, 400],
                    x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    delay: Math.random() * 1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
            
            {/* Level up content */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 15 }}
              className="relative z-10"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isArabic ? 'تهانينا!' : 'Congratulations!'}
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                {isArabic 
                  ? `تمت ترقيتك إلى مستوى ${newLevelConfig.nameAr}!`
                  : `You've been promoted to ${newLevelConfig.name}!`
                }
              </p>
              
              {/* Level badge */}
              <motion.div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold ${newLevelConfig.bgColor}`}
                style={{ 
                  background: newLevel === 10 
                    ? 'linear-gradient(45deg, #ec4899, #8b5cf6, #06b6d4)' 
                    : undefined 
                }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity,
                  repeatDelay: 1 
                }}
              >
                <span className="text-2xl">{newLevelConfig.emoji}</span>
                <span className="text-lg">
                  {isArabic ? newLevelConfig.nameAr : newLevelConfig.name}
                  {newLevel > 0 && ` ${newLevel}`}
                </span>
              </motion.div>
              
              {/* Level progression */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-2xl">{SUPPORTER_LEVELS[oldLevel].emoji}</span>
                  <span className="text-sm text-gray-500">
                    {isArabic ? SUPPORTER_LEVELS[oldLevel].nameAr : SUPPORTER_LEVELS[oldLevel].name}
                  </span>
                </div>
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-2xl"
                >
                  ➡️
                </motion.div>
                <div className="flex items-center gap-1">
                  <span className="text-2xl">{newLevelConfig.emoji}</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {isArabic ? newLevelConfig.nameAr : newLevelConfig.name}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                {isArabic 
                  ? 'شكراً لدعمك المستمر!' 
                  : 'Thank you for your continuous support!'
                }
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SupporterLevelUpNotification;