import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GiftAnimationProps {
  gift: {
    name: string;
    emoji: string;
    animationType: string;
    effectDuration: number;
    hasSpecialEffects: boolean;
    hasSound: boolean;
  };
  isVisible: boolean;
  onComplete: () => void;
}

export function GiftAnimation({ gift, isVisible, onComplete }: GiftAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (isVisible && gift.hasSpecialEffects) {
      // Generate random particles for special effects
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      }));
      setParticles(newParticles);
    }
  }, [isVisible, gift.hasSpecialEffects]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, gift.effectDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, gift.effectDuration, onComplete]);

  const getAnimationVariants = () => {
    switch (gift.animationType) {
      case 'bounce':
        return {
          initial: { scale: 0, y: -100 },
          animate: { 
            scale: [0, 1.5, 1], 
            y: [0, -50, 0],
            transition: { duration: 1, ease: "easeOut" }
          },
          exit: { scale: 0, opacity: 0 }
        };
      case 'float':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { 
            scale: 1, 
            opacity: 1,
            y: [-20, 20, -20],
            transition: { 
              duration: 2, 
              y: { repeat: Infinity, duration: 2 }
            }
          },
          exit: { scale: 0, opacity: 0 }
        };
      case 'shine':
        return {
          initial: { scale: 0, rotate: -180 },
          animate: { 
            scale: [0, 1.2, 1], 
            rotate: 0,
            filter: ["brightness(1)", "brightness(2)", "brightness(1)"],
            transition: { duration: 1.5 }
          },
          exit: { scale: 0, opacity: 0 }
        };
      case 'sparkle':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { 
            scale: [0, 1.5, 1], 
            opacity: 1,
            filter: ["brightness(1)", "brightness(3)", "brightness(1)"],
            boxShadow: [
              "0 0 0px rgba(59, 130, 246, 0.5)",
              "0 0 30px rgba(59, 130, 246, 0.8)",
              "0 0 0px rgba(59, 130, 246, 0.5)"
            ],
            transition: { duration: 2 }
          },
          exit: { scale: 0, opacity: 0 }
        };
      case 'drive':
        return {
          initial: { x: -200, scale: 0.5 },
          animate: { 
            x: [0, 100, 0], 
            scale: 1,
            rotate: [0, 10, -10, 0],
            transition: { duration: 2.5, ease: "easeInOut" }
          },
          exit: { x: 200, scale: 0 }
        };
      case 'fly':
        return {
          initial: { y: 100, x: -100, scale: 0.3 },
          animate: { 
            y: [-50, -100, -50], 
            x: [0, 50, 100],
            scale: [0.5, 1, 0.8],
            rotate: [0, 360],
            transition: { duration: 3, ease: "easeInOut" }
          },
          exit: { y: -200, x: 200, scale: 0 }
        };
      case 'magic':
        return {
          initial: { scale: 0, rotate: 0 },
          animate: { 
            scale: [0, 1.5, 1.2, 1], 
            rotate: [0, 180, 360],
            filter: [
              "hue-rotate(0deg) saturate(1)",
              "hue-rotate(180deg) saturate(2)",
              "hue-rotate(360deg) saturate(1)"
            ],
            transition: { duration: 3 }
          },
          exit: { scale: 0, opacity: 0 }
        };
      default:
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0, opacity: 0 }
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {/* Main Gift Animation */}
          <motion.div
            variants={getAnimationVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-8xl filter drop-shadow-2xl"
          >
            {gift.emoji}
          </motion.div>

          {/* Gift Name */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute top-1/2 mt-20 text-center"
          >
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-bold text-xl shadow-2xl">
              {gift.name}
            </div>
          </motion.div>

          {/* Special Effects Particles */}
          {gift.hasSpecialEffects && (
            <div className="absolute inset-0">
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ 
                    x: particle.x, 
                    y: particle.y, 
                    scale: 0, 
                    opacity: 0 
                  }}
                  animate={{ 
                    scale: [0, 1, 0], 
                    opacity: [0, 1, 0],
                    y: particle.y - 100,
                    transition: { 
                      duration: 2, 
                      delay: Math.random() * 1 
                    }
                  }}
                  className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full"
                />
              ))}
            </div>
          )}

          {/* Background Glow Effect */}
          {gift.hasSpecialEffects && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.3, 0], 
                scale: [0, 2, 3],
                transition: { duration: gift.effectDuration, ease: "easeOut" }
              }}
              className="absolute inset-0 bg-gradient-radial from-pink-400/20 via-purple-400/10 to-transparent rounded-full"
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
}