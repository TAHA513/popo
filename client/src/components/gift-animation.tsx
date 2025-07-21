import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface GiftAnimationProps {
  giftId: string;
  giftName: string;
  arabicName: string;
  icon: any;
  gradient: string;
  onComplete?: () => void;
}

const GiftAnimation = ({ giftId, giftName, arabicName, icon: IconComponent, gradient, onComplete }: GiftAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getAnimationByGift = (id: string) => {
    switch (id) {
      case 'heart':
        return {
          initial: { scale: 0, rotate: 0 },
          animate: { 
            scale: [0, 1.2, 1, 1.1, 1],
            rotate: [0, 10, -10, 5, 0],
            y: [0, -20, 0]
          },
          transition: { duration: 2, ease: "easeInOut" }
        };
      case 'rose':
        return {
          initial: { scale: 0, y: 50 },
          animate: { 
            scale: [0, 1.2, 1],
            y: [50, -10, 0],
            rotate: [0, 360]
          },
          transition: { duration: 2.5, ease: "easeInOut" }
        };
      case 'crown':
        return {
          initial: { scale: 0, y: -50 },
          animate: { 
            scale: [0, 1.3, 1],
            y: [-50, 10, 0],
            rotateY: [0, 180, 360]
          },
          transition: { duration: 3, ease: "easeInOut" }
        };
      case 'diamond':
        return {
          initial: { scale: 0, rotate: 0 },
          animate: { 
            scale: [0, 1.5, 1],
            rotate: [0, 720],
            filter: ["brightness(1)", "brightness(2)", "brightness(1)"]
          },
          transition: { duration: 2.8, ease: "easeInOut" }
        };
      case 'car':
        return {
          initial: { x: -100, scale: 0 },
          animate: { 
            x: [100, 0],
            scale: [0, 1.2, 1],
            rotate: [0, 10, 0]
          },
          transition: { duration: 2.5, ease: "easeInOut" }
        };
      case 'plane':
        return {
          initial: { x: -150, y: 50, scale: 0 },
          animate: { 
            x: [150, 0],
            y: [50, -20, 0],
            scale: [0, 1.3, 1],
            rotate: [0, 360]
          },
          transition: { duration: 3.5, ease: "easeInOut" }
        };
      default:
        return {
          initial: { scale: 0 },
          animate: { 
            scale: [0, 1.2, 1],
            rotate: [0, 360]
          },
          transition: { duration: 2, ease: "easeInOut" }
        };
    }
  };

  const animation = getAnimationByGift(giftId);

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Main gift animation */}
          <motion.div
            className="relative"
            {...animation}
          >
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl`}>
              <IconComponent className="w-16 h-16 text-white drop-shadow-lg" />
            </div>

            {/* Sparkle effects */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: 1,
                }}
              />
            ))}

            {/* Gift name */}
            <motion.div
              className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                <h3 className="font-bold text-lg text-purple-600">{arabicName}</h3>
              </div>
            </motion.div>

            {/* Floating hearts for emotional gifts */}
            {(giftId === 'heart' || giftId === 'rose') && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`heart-${i}`}
                    className="absolute text-red-400 text-xl"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      y: [-20, -40, -60],
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.3,
                    }}
                  >
                    ❤️
                  </motion.div>
                ))}
              </>
            )}

            {/* Crown glow effect */}
            {giftId === 'crown' && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 2, 1.5] }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
            )}

            {/* Diamond shine effect */}
            {giftId === 'diamond' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
                initial={{ x: -200 }}
                animate={{ x: 200 }}
                transition={{ duration: 1, delay: 1, repeat: 2 }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiftAnimation;