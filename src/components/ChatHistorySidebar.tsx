import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Trash2, Search, Clock, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { ChatSession, getChatSessions, deleteChatSession } from '@/services/companyResearchService';
import { format, formatDistanceToNow } from 'date-fns';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  currentSessionId: string | null;
}

export default function ChatHistorySidebar({
  isOpen,
  onClose,
  onSelectSession,
  onNewChat,
  currentSessionId
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Refresh sessions when sidebar opens
  useEffect(() => {
    if (isOpen) {
      const allSessions = getChatSessions();
      setSessions(allSessions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ));
    }
  }, [isOpen]);

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.companyData?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    session.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    onSelectSession(session);
    onClose();
  };

  const getSessionPreview = (session: ChatSession): string => {
    if (session.messages.length === 0) return 'Empty chat';
    const lastMessage = session.messages[session.messages.length - 1];
    if (lastMessage.content.length > 60) {
      return lastMessage.content.substring(0, 60) + '...';
    }
    return lastMessage.content;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-background/95 backdrop-blur-xl border-r border-border z-50 lg:z-40 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold">Chat History</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* New Chat Button */}
              <Button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>

              {/* Search */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1">
              {filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    {sessions.length === 0 ? 'No Chat History' : 'No Results Found'}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {sessions.length === 0
                      ? 'Your chat conversations will appear here. Start a new chat to begin!'
                      : 'Try a different search term'}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredSessions.map((session) => {
                    const isActive = session.id === currentSessionId;
                    const messageCount = session.messages.length;
                    const hasCompany = session.companyData !== null;
                    
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => handleSelectSession(session)}
                        className={`p-3 rounded-lg cursor-pointer transition-all group ${
                          isActive
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-glass border border-border hover:border-primary/50 hover:bg-primary/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold text-sm truncate ${
                                isActive ? 'text-primary' : 'text-foreground'
                              }`}>
                                {session.title}
                              </h3>
                              {hasCompany && (
                                <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                  {session.companyData?.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {getSessionPreview(session)}
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                <span>{messageCount} {messageCount === 1 ? 'message' : 'messages'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteSession(e, session.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {sessions.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/20">
                <p className="text-xs text-muted-foreground text-center">
                  {sessions.length} {sessions.length === 1 ? 'chat' : 'chats'} saved locally
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

