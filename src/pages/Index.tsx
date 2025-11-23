import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Moon, Sun, Menu, Clock, X, Building2, Bot, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { ChatMessage } from '@/components/ChatMessage';
import { SuggestedPrompts } from '@/components/SuggestedPrompts';
import { AccountPlanDocument } from '@/components/AccountPlanDocument';
import HistoryModal from '@/components/HistoryModal';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import { companyResearchService, AgentMessage, CompanyData, CompanyHistory, ChatSession, createNewChatSession, saveChatSession, getChatSessions, deleteChatSession, getChatSession } from '@/services/companyResearchService';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareCompanyData, setCompareCompanyData] = useState<CompanyData | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Initialize chat session on mount
  useEffect(() => {
    const newSession = createNewChatSession();
    setCurrentSession(newSession);
    
    // Cleanup voice recognition on unmount
    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {
          // Ignore errors
        }
      }
    };
  }, []);
  
  // Save session when messages or company data changes
  useEffect(() => {
    if (currentSession) {
      const updatedSession: ChatSession = {
        ...currentSession,
        messages,
        companyData,
        updatedAt: new Date()
      };
      saveChatSession(updatedSession);
      setCurrentSession(updatedSession);
    }
  }, [messages, companyData]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || isProcessing) return;
    
    setShowSuggestions(false);
    setIsProcessing(true);
    
    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const lowerText = text.toLowerCase();

    // Check if it's a comparison request
    const isComparisonRequest = (lowerText.includes('compare') || lowerText.includes('vs') || lowerText.includes('versus')) && companyData;

    try {
      if (isComparisonRequest && !compareMode) {
        // Extract company name from comparison request
        const companyName = text.replace(/compare|vs|versus|with|to/gi, '').trim();
        
        const { messages: agentMessages, companyData: newData } = await companyResearchService.searchCompany(companyName);
        setMessages(prev => [...prev, ...agentMessages]);
        
        if (newData) {
          setCompareCompanyData(newData);
          setCompareMode(true);
          toast({
            title: "Comparison Mode Activated",
            description: `Comparing ${companyData?.name} with ${newData.name}`,
          });
        }
      } else {
        // Check if it's a research query - improved detection
        const researchKeywords = [
          'research', 'analyze', 'tell me about', 'show me', 'find', 'look up', 
          'search for', 'information about', 'data on', 'details about',
          'what is', 'who is', 'tell me', 'learn about', 'get info'
        ];
        const companyIndicators = ['inc', 'corp', 'ltd', 'llc', 'company', 'technologies', 'systems'];
        const isResearch = researchKeywords.some(keyword => lowerText.includes(keyword)) ||
                          (text.length > 5 && companyIndicators.some(indicator => lowerText.includes(indicator))) ||
                          (text.length > 8 && !lowerText.includes('?') && !companyData); // Likely a company name if it's a longer phrase without context
        
        if (isResearch) {
          const { messages: agentMessages, companyData: newData } = await companyResearchService.searchCompany(text);
          setMessages(prev => [...prev, ...agentMessages]);
          if (newData) {
            if (compareMode) {
              setCompareCompanyData(newData);
            } else {
              setCompanyData(newData);
            }
            toast({
              title: "Research Complete",
              description: `Analysis for ${newData.name} saved to your local history.`,
            });
          }
        } else {
          // Show typing indicator
          setIsTyping(true);
          
          // Handle follow-up questions about current company with conversation context
          const agentMessage = await companyResearchService.handleFollowUpQuestion(
            text, 
            companyData,
            messages // Pass conversation history for context
          );
          
          setIsTyping(false);
          setMessages(prev => [...prev, agentMessage]);
          if (text.toLowerCase().includes('help') || text.length < 10) {
            setShowSuggestions(true);
          }
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      // Stop listening if already in voice mode
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
        setRecognitionInstance(null);
      }
      setIsListening(false);
      setIsVoiceMode(false);
    } else {
      // Check for browser support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast({
          title: "Not Supported",
          description: "Voice recognition is not supported in your browser. Please try Chrome or Edge.",
          variant: "destructive"
        });
        return;
      }
      
      setIsVoiceMode(true);
      toast({
        title: "Voice Mode Activated",
        description: "Click the microphone button to start speaking",
      });
    }
  };

  const handleVoiceAction = () => {
    if (!isVoiceMode) {
      toggleVoiceMode();
      return;
    }
    
    if (isListening) {
      // Stop listening
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {
          // Ignore errors
        }
        setRecognitionInstance(null);
      }
      setIsListening(false);
      return;
    }
    
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in your browser. Please try Chrome or Edge.",
        variant: "destructive"
      });
      setIsVoiceMode(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true; // Show interim results for better UX
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionInstance(recognition);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setIsListening(false);
          setIsSpeaking(true);
          handleSendMessage(finalTranscript.trim());
          setTimeout(() => {
            setIsSpeaking(false);
          }, 2000);
          
          // Clean up
          try {
            recognition.stop();
          } catch (e) {
            // Ignore
          }
          setRecognitionInstance(null);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setRecognitionInstance(null);
        
        let errorMessage = "Could not detect speech. Please try again.";
        if (event.error === 'no-speech') {
          errorMessage = "No speech detected. Please try again.";
        } else if (event.error === 'audio-capture') {
          errorMessage = "Microphone not found. Please check your microphone settings.";
        } else if (event.error === 'not-allowed') {
          errorMessage = "Microphone permission denied. Please allow microphone access.";
        }
        
        toast({
          title: "Voice Error",
          description: errorMessage,
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsListening(false);
        setRecognitionInstance(null);
      };

      recognition.start();
    } catch (error) {
      setIsListening(false);
      setIsVoiceMode(false);
      setRecognitionInstance(null);
      toast({
        title: "Error",
        description: "Failed to start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleNewChat = () => {
    // Save current session before creating new one
    if (currentSession && messages.length > 0) {
      saveChatSession({
        ...currentSession,
        messages,
        companyData,
        updatedAt: new Date()
      });
    }
    
    // Create new session
    const newSession = createNewChatSession();
    setCurrentSession(newSession);
    setMessages([]);
    setCompanyData(null);
    setCompareCompanyData(null);
    setCompareMode(false);
    setShowSuggestions(true);
    toast({
      title: "New Chat Started",
      description: "You've started a new conversation",
    });
  };

  const handleSelectChatSession = (session: ChatSession) => {
    // Save current session
    if (currentSession && messages.length > 0) {
      saveChatSession({
        ...currentSession,
        messages,
        companyData,
        updatedAt: new Date()
      });
    }
    
    // Load selected session
    setCurrentSession(session);
    setMessages(session.messages);
    setCompanyData(session.companyData);
    setShowSuggestions(session.messages.length === 0);
    
    toast({
      title: "Chat Loaded",
      description: `Loaded "${session.title}"`,
    });
  };

  const handleDocumentEdit = (section: string, newContent: string) => {
    toast({
      title: "Section Updated",
      description: `I've noticed you updated the ${section} section. I'll keep that in mind for future analysis.`,
    });
  };

  const handleSelectHistory = (history: CompanyHistory) => {
    setCompanyData(history.companyData);
    const historyMessage: AgentMessage = {
      id: `history-${Date.now()}`,
      role: 'agent',
      content: `Loaded research for ${history.companyData.name} from your history. You can continue editing or start a new search.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, historyMessage]);
    toast({
      title: "History Loaded",
      description: `Restored analysis for ${history.companyData.name}`,
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 right-4 z-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* New Chat, Theme Toggle & History */}
      <div className="fixed top-4 right-16 z-50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsChatHistoryOpen(true)}
          className="gap-2"
          title="Chat History"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Chats</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewChat}
          className="gap-2"
          title="New Chat"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
        {compareMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCompareMode(false);
              setCompareCompanyData(null);
            }}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Exit Compare
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsHistoryOpen(true)}
          title="View History"
        >
          <Clock className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDark(!isDark)}
          title="Toggle Theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Left Panel - Chat */}
      <div className="flex-1 flex flex-col border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Research Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered company research & account planning
          </p>
        </div>

        {/* Messages Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-accent">
                  <Bot className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {showSuggestions && messages.length <= 1 && (
            <SuggestedPrompts
              prompts={companyResearchService.getSuggestedPrompts()}
              onSelect={handleSendMessage}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-border">
          <AnimatePresence mode="wait">
            {isVoiceMode ? (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <VoiceVisualizer
                  isActive={isVoiceMode}
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                />
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={handleVoiceAction}
                    className={isListening ? 'animate-pulse-glow' : ''}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={toggleVoiceMode}
                  >
                    Exit Voice Mode
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-2"
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleVoiceMode}
                  className="shrink-0"
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me to research a company..."
                  className="flex-1 glass rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
                  disabled={isProcessing}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  size="icon"
                  className="shrink-0"
                  disabled={!input.trim() || isProcessing}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel - Document (Hidden on mobile by default) */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isMobileMenuOpen ? 0 : '0%' }}
        className={`${
          isMobileMenuOpen ? 'fixed inset-0 z-40' : 'hidden lg:block'
        } lg:w-1/2 bg-card border-l border-border overflow-y-auto`}
      >
        {compareMode && companyData && compareCompanyData ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4">
            <div className="border-b xl:border-b-0 xl:border-r border-border pb-4 xl:pr-4">
              <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-card pb-2 z-10">
                {companyData.name}
              </h3>
              <AccountPlanDocument
                companyData={companyData}
                onEdit={handleDocumentEdit}
              />
            </div>
            <div className="xl:pl-4">
              <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-card pb-2 z-10">
                {compareCompanyData.name}
              </h3>
              <AccountPlanDocument
                companyData={compareCompanyData}
                onEdit={handleDocumentEdit}
              />
            </div>
          </div>
        ) : companyData ? (
          <AccountPlanDocument
            companyData={companyData}
            onEdit={handleDocumentEdit}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No Company Selected</h3>
                <p className="text-muted-foreground">
                  Start by researching a company to generate an account plan
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* History Modal */}
      {isHistoryOpen && (
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onSelectHistory={handleSelectHistory}
        />
      )}

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={isChatHistoryOpen}
        onClose={() => setIsChatHistoryOpen(false)}
        onSelectSession={handleSelectChatSession}
        onNewChat={handleNewChat}
        currentSessionId={currentSession?.id || null}
      />
    </div>
  );
};

export default Index;
