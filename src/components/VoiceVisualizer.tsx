import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
}

export const VoiceVisualizer = ({ isActive, isListening, isSpeaking }: VoiceVisualizerProps) => {
  const [bars, setBars] = useState<number[]>(Array(40).fill(0.2));

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => {
        if (isListening) {
          // Rapid, chaotic movement when user speaks
          return Math.random() * 0.9 + 0.1;
        } else if (isSpeaking) {
          // Smooth, rhythmic wave when AI speaks
          return Math.sin(Date.now() / 200) * 0.4 + 0.5;
        } else {
          // Gentle breathing when idle
          return Math.sin(Date.now() / 1000) * 0.15 + 0.25;
        }
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [isActive, isListening, isSpeaking]);

  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center h-48 gap-1">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-gradient-to-t from-primary to-accent rounded-full"
          style={{
            height: `${height * 100}%`,
            filter: `drop-shadow(0 0 ${height * 10}px hsl(var(--agent-glow) / 0.6))`
          }}
          animate={{
            height: `${height * 100}%`,
            opacity: 0.6 + height * 0.4
          }}
          transition={{
            duration: isListening ? 0.1 : isSpeaking ? 0.3 : 0.8,
            ease: isListening ? "linear" : "easeInOut"
          }}
        />
      ))}
    </div>
  );
};
