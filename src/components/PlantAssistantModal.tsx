import React, { useState, useRef, useEffect } from 'react';
import { Plant } from '../types/plant';
import { HealthAssessment } from '../types/health';
import { calculatePlantHealthScore } from '../utils/healthCalculator';
import { 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  AlertCircle, 
  Bot, 
  User, 
  Leaf, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface PlantAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  plants: Plant[];
  allAssessments?: HealthAssessment[];
  initialPlantId?: string;
}

const QUICK_QUESTIONS = [
  'Why are my leaves turning yellow?',
  'How often should I water my plant?',
  'How can I identify pests?',
  'When should I repot my plant?',
];

export const PlantAssistantModal: React.FC<PlantAssistantModalProps> = ({
  isOpen,
  onClose,
  plants,
  allAssessments = [],
  initialPlantId,
}) => {
  const [selectedPlantId, setSelectedPlantId] = useState<string>(initialPlantId || 'general');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  // Initial welcome greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        "Hello! I'm your SproutCare Assistant. Whether you need diagnostics for yellowing leaves, watering advice, lighting tips, or repotting guidance, I'm here to help your plants flourish. Select a specific plant above or ask any general plant care question!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initialPlantId when changed externally
  useEffect(() => {
    if (initialPlantId) {
      setSelectedPlantId(initialPlantId);
    }
  }, [initialPlantId]);

  // Scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlant = selectedPlantId !== 'general' 
    ? plants.find((p) => p.id === selectedPlantId) 
    : undefined;

  // Build the plantContext payload for backend API
  const getPlantContextPayload = () => {
    if (!currentPlant) return undefined;
    const healthInfo = calculatePlantHealthScore(currentPlant, allAssessments, []);
    return {
      name: currentPlant.name,
      species: currentPlant.species,
      room: currentPlant.room,
      light: currentPlant.light,
      wateringFrequencyDays: currentPlant.wateringFrequencyDays,
      fertilizingFrequencyDays: currentPlant.fertilizingFrequencyDays,
      pruningFrequencyDays: currentPlant.pruningFrequencyDays,
      lastWatered: currentPlant.lastWatered,
      lastFertilized: currentPlant.lastFertilized,
      lastPruned: currentPlant.lastPruned,
      healthScore: healthInfo.totalScore,
      healthLabel: healthInfo.label,
      notes: currentPlant.notes,
    };
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setErrorMessage(null);
    setLastFailedMessage(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update conversation with user message immediately
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Format messages for backend API
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/plant-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          plantContext: getPlantContextPayload(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get a response from the plant care assistant.');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I am ready to help with your plant care questions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Plant assistant request failed:', err);
      const friendlyErr = err.message || 'Unable to connect to the assistant. Please try again.';
      setErrorMessage(friendlyErr);
      setLastFailedMessage(trimmed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content:
          "Conversation cleared! How can I help you care for your plants today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMessage(null);
    setLastFailedMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl border border-stone-200/90 shadow-2xl flex flex-col h-[90vh] max-h-[720px] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-200/80 bg-stone-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="assistant-modal-title" className="text-base font-bold text-stone-900 font-display">
                  SproutCare Assistant
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 rounded-full">
                  AI Specialist
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Botanical advice, diagnosis, and care routines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Clear</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plant Context Selector Bar */}
        <div className="px-5 py-2.5 bg-emerald-50/60 border-b border-emerald-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-emerald-950 font-medium">
            <Leaf className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Consulting about:</span>
          </div>

          <select
            value={selectedPlantId}
            onChange={(e) => setSelectedPlantId(e.target.value)}
            className="text-xs bg-white border border-stone-200 text-stone-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all font-medium truncate max-w-full sm:max-w-xs"
          >
            <option value="general">🌿 General Plant Care (No specific plant)</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.species}) · {p.room}
              </option>
            ))}
          </select>
        </div>

        {/* Conversation Message Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-stone-50/30">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                    isUser
                      ? 'bg-emerald-800 text-white'
                      : 'bg-white border border-stone-200 text-emerald-700'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] sm:max-w-[78%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 text-xs sm:text-sm leading-relaxed rounded-2xl whitespace-pre-wrap ${
                      isUser
                        ? 'bg-emerald-700 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white border border-stone-200/80 text-stone-800 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div
                    className={`text-[10px] text-stone-400 px-1 font-mono ${
                      isUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Thinking / Loading Bubble */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white border border-stone-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3.5 bg-white border border-stone-200/80 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-2">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse [animation-delay:200ms]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse [animation-delay:400ms]"></span>
                </div>
                <span className="text-xs text-stone-500 font-medium ml-1">
                  SproutCare Assistant is analyzing...
                </span>
              </div>
            </div>
          )}

          {/* Error Banner with Retry */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              {lastFailedMessage && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="px-3 py-1 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors font-semibold flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions Suggestions (Shown when input is empty & not loading) */}
        {!isLoading && (
          <div className="px-4 py-2 border-t border-stone-100 bg-white/90 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-stone-400 whitespace-nowrap uppercase tracking-wider flex items-center gap-1 shrink-0">
              <HelpCircle className="w-3 h-3 text-stone-400" />
              <span>Quick:</span>
            </span>
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => sendMessage(question)}
                className="px-2.5 py-1 text-xs bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200/80 hover:border-emerald-300 rounded-full whitespace-nowrap transition-colors shrink-0"
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-stone-200/80 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={
                currentPlant
                  ? `Ask a question about ${currentPlant.name}...`
                  : 'Ask about watering, lighting, repotting, or pests...'
              }
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:bg-white text-stone-900 placeholder:text-stone-400 transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-400 px-1">
            <span>Press Enter to send · Shift+Enter for newline</span>
            <span>SproutCare AI Guidance</span>
          </div>
        </div>
      </div>
    </div>
  );
};
