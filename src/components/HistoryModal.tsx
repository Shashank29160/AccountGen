import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trash2, Search, FileText, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { CompanyHistory, getHistory, clearHistory, getChatSessions } from '@/services/companyResearchService';
import { format } from 'date-fns';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistory: (history: CompanyHistory) => void;
}

export default function HistoryModal({ isOpen, onClose, onSelectHistory }: HistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<CompanyHistory[]>([]);
  const [companyAnalyses, setCompanyAnalyses] = useState<Map<string, CompanyHistory>>(new Map());

  // Refresh history when modal opens - show company-based analysis
  useEffect(() => {
    if (isOpen) {
      const allHistory = getHistory();
      const sessions = getChatSessions();
      
      // Get unique company analyses from history
      const companyMap = new Map<string, CompanyHistory>();
      
      // Add from direct history
      allHistory.forEach(item => {
        const key = item.companyName.toLowerCase();
        if (!companyMap.has(key) || new Date(item.timestamp) > new Date(companyMap.get(key)!.timestamp)) {
          companyMap.set(key, item);
        }
      });
      
      // Add from chat sessions (most recent analysis per company)
      sessions.forEach(session => {
        if (session.companyData) {
          const key = session.companyData.name.toLowerCase();
          const existing = companyMap.get(key);
          if (!existing || new Date(session.updatedAt) > new Date(existing.timestamp)) {
            companyMap.set(key, {
              id: session.id,
              companyName: session.companyData.name,
              companyData: session.companyData,
              timestamp: session.updatedAt
            });
          }
        }
      });
      
      setCompanyAnalyses(companyMap);
      setHistory(Array.from(companyMap.values()).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    }
  }, [isOpen]);

  const filteredHistory = history.filter(item =>
    item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.companyData.executiveSummary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      clearHistory();
      setHistory([]);
    }
  };

  const handleSelectHistory = (item: CompanyHistory) => {
    onSelectHistory(item);
    onClose();
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[80vh] bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Company Analyses</h2>
                  <p className="text-sm text-muted-foreground">
                    {history.length} {history.length === 1 ? 'company analysis' : 'company analyses'} available
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-border">
                <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search company analyses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* History List */}
            <ScrollArea className="h-[400px]">
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    {history.length === 0 ? 'No Company Analyses Yet' : 'No Results Found'}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {history.length === 0
                      ? 'Company analyses will appear here after you research companies. Each company will have one analysis entry showing the most recent research.'
                      : 'Try a different search term'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {filteredHistory.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleSelectHistory(item)}
                      className="p-4 bg-glass border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                            {item.companyData.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {item.companyData.executiveSummary}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(item.timestamp, 'MMM d, yyyy • h:mm a')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            View
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {history.length > 0 && (
              <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  History is saved locally on your device
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearHistory}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All History
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
