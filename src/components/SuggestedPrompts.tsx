import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export const SuggestedPrompts = ({ prompts, onSelect }: SuggestedPromptsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 my-4"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 w-full">
        <Sparkles className="h-4 w-4" />
        <span>Try these:</span>
      </div>
      {prompts.map((prompt, i) => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(prompt)}
          className="glass px-4 py-2 rounded-full text-sm hover:bg-primary/10 transition-colors"
        >
          {prompt}
        </motion.button>
      ))}
    </motion.div>
  );
};
