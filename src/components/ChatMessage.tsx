import { motion } from 'framer-motion';
import { User, Bot, Loader2, CheckCircle2 } from 'lucide-react';
import { AgentMessage } from '@/services/companyResearchService';

interface ChatMessageProps {
  message: AgentMessage;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const isStatus = message.role === 'status';

  if (isStatus) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-muted-foreground py-2"
      >
        {message.completed ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-status-thinking" />
        )}
        <span>{message.content}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary' : 'bg-accent'
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-accent-foreground" />
        )}
      </div>
      
      <div className={`glass rounded-2xl px-4 py-3 max-w-[80%] ${
        isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
      }`}>
        <p className="text-sm leading-relaxed">{message.content}</p>
        <span className="text-xs text-muted-foreground mt-1 block">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};
