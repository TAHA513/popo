import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoveGiftEffectProps {
  isActive: boolean;
  language: 'ar' | 'en';
  onComplete: () => void;
}

export function LoveGiftEffect({ isActive, language, onComplete }: LoveGiftEffectProps) {
  const [showHearts, setShowHearts] = useState(false);
  const [showText, setShowText] = useState(false);

  const loveText = {
    ar: 'أحبك ❤️',
    en: 'I Love You ❤️'
  };

  useEffect(() => {
    if (isActive) {
      // Play sound effect
      playLoveSound(language);
      
      // Start heart animation
      setShowHearts(true);
      
      // Show text after 0.5 seconds
      setTimeout(() => setShowText(true), 500);
      
      // Complete effect after 4 seconds
      setTimeout(() => {
        setShowHearts(false);
        setShowText(false);
        onComplete();
      }, 4000);
    }
  }, [isActive, language, onComplete]);

  const playLoveSound = (lang: 'ar' | 'en') => {
    // Create speech synthesis for "I Love You" / "أحبك"
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance();
      utterance.text = lang === 'ar' ? 'أحبك' : 'I Love You';
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      utterance.volume = 0.8;
      
      window.speechSynthesis.speak(utterance);
    }
    
    // Also play a heart beat sound effect
    const audio = new Audio('/sounds/heartbeat.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {
      // Fallback if audio fails
      console.log('Audio playback failed');
    });
  };

  const generateHearts = () => {
    return Array.from({ length: 20 }, (_, i) => (
      <motion.div
        key={i}
        className="absolute text-red-500"
        style={{
          fontSize: Math.random() * 20 + 20 + 'px',
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
        }}
        initial={{ 
          scale: 0,
          opacity: 0,
          rotate: 0,
          x: 0,
          y: 0
        }}
        animate={{ 
          scale: [0, 1.5, 1],
          opacity: [0, 1, 0],
          rotate: [0, 360],
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200
        }}
        transition={{
          duration: 3,
          delay: Math.random() * 2,
          ease: "easeOut"
        }}
      >
        💖
      </motion.div>
    ));
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Romantic background overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-red-500/20 to-purple-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Floating hearts */}
          {showHearts && (
            <div className="relative w-full h-full overflow-hidden">
              {generateHearts()}
            </div>
          )}

          {/* Central love message */}
          {showText && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 1]
                }}
                exit={{ 
                  scale: 0,
                  opacity: 0
                }}
                transition={{ 
                  duration: 0.8,
                  ease: "backOut"
                }}
              >
                <motion.div
                  className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-purple-500 drop-shadow-2xl"
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    textShadow: '0 0 20px rgba(255, 20, 147, 0.8), 0 0 40px rgba(255, 20, 147, 0.6)',
                    fontFamily: language === 'ar' ? 'Cairo, sans-serif' : 'Poppins, sans-serif'
                  }}
                >
                  {loveText[language]}
                </motion.div>
                
                {/* Sparkling particles around text */}
                {Array.from({ length: 10 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-300"
                    style={{
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%',
                      fontSize: '20px'
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      rotate: [0, 180]
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 1.5,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Pulsing heart border effect */}
          <motion.div
            className="absolute inset-4 border-4 border-red-500 rounded-3xl"
            style={{
              boxShadow: '0 0 50px rgba(255, 20, 147, 0.6), inset 0 0 50px rgba(255, 20, 147, 0.3)'
            }}
            animate={{ 
              scale: [1, 1.02, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoveGiftEffect;