import React, { useState, useEffect, useRef } from 'react';
import { Plant } from '../types/plant';
import { GrowthRecord } from '../types/growth';
import { HealthAssessment } from '../types/health';
import { ChatMessage } from '../types/assistant';
import { PlantIllustration } from './PlantIllustration';
import { HealthScoreBadge } from './HealthScoreBadge';
import { buildSelectedPlantContext, buildAllPlantsSummary } from '../utils/assistantContext';
import { loadChatForContext, saveChatForContext, clearChatForContext } from '../utils/assistantStorage';
import { calculatePlantHealthScore } from '../utils/healthCalculator';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  Leaf, 
  AlertCircle, 
  User, 
  CheckCircle2, 
  HelpCircle,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
  Droplets,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

interface AIAssistantProps {
  plants: Plant[];
  allAssessments: HealthAssessment[];
  allGrowthRecords: GrowthRecord[];
  initialSelectedPlantId?: string;
  onNavigateToPlantDetail?: (plant: Plant) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  plants,
  allAssessments,
  allGrowthRecords,
  initialSelectedPlantId,
  onNavigateToPlantDetail,
}) => {
  // Context state: 'general' or specific plantId
  const [selectedContextId, setSelectedContextId] = useState<string>(
    initialSelectedPlantId || 'general'
  );

  const selectedPlant = plants.find((p) => p.id === selectedContextId) || null;

  // Active chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => 
    loadChatForContext(selectedContextId)
  );

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync when context changes
  useEffect(() => {
    const loaded = loadChatForContext(selectedContextId);
    setMessages(loaded);
    setErrorMessage(null);
  }, [selectedContextId]);

  // Save messages on update
  useEffect(() => {
    saveChatForContext(selectedContextId, messages);
  }, [selectedContextId, messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Plant health breakdown for active selected plant
  const selectedPlantHealth = selectedPlant
    ? calculatePlantHealthScore(selectedPlant, allAssessments, allGrowthRecords)
    : null;

  // Context-aware suggested questions
  const suggestedQuestions: string[] = React.useMemo(() => {
    if (selectedPlant) {
      const suggestions = [
        `Analyse ${selectedPlant.name}'s health score (${selectedPlantHealth?.totalScore}/100)`,
        `How often should I water my ${selectedPlant.name}?`,
        `Is ${selectedPlant.room} light suitable for this plant?`,
        `Explain ${selectedPlant.name}'s growth progress`,
      ];

      // Add symptom-specific prompt if condition warrants it
      if (selectedPlantHealth?.latestAssessment?.leafCondition === 'yellowing') {
        suggestions.unshift(`Why are my ${selectedPlant.name}'s leaves turning yellow?`);
      } else if (selectedPlantHealth?.latestAssessment?.leafCondition === 'brown-spots') {
        suggestions.unshift(`How do I fix brown spots on my ${selectedPlant.name}?`);
      } else if (selectedPlantHealth?.latestAssessment?.pestCondition !== 'no-pests') {
        suggestions.unshift(`How should I treat pests on my ${selectedPlant.name}?`);
      }

      return suggestions.slice(0, 4);
    } else {
      return [
        'Which of my plants need attention today?',
        "Recommend today's plant care routine",
        'Which plant in my collection has grown the most?',
        'How can I improve my indoor collection health?',
      ];
    }
  }, [selectedPlant, selectedPlantHealth]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      plantId: selectedPlant?.id,
      plantName: selectedPlant?.name,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Build context payloads
      const selectedPlantContext = selectedPlant
        ? buildSelectedPlantContext(selectedPlant, allAssessments, allGrowthRecords)
        : null;

      const allPlantsContext = buildAllPlantsSummary(plants, allAssessments, allGrowthRecords);

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          selectedPlantId: selectedPlant?.id,
          selectedPlantContext,
          allPlantsContext,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'The assistant could not respond at this time.');
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        plantId: selectedPlant?.id,
        plantName: selectedPlant?.name,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error sending message to assistant:', err);
      const friendlyErr = err.message || 'Unable to connect to the plant care assistant. Please try again.';
      setErrorMessage(friendlyErr);
      
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Notice:** ${friendlyErr}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear conversation history for this plant or general care?')) {
      clearChatForContext(selectedContextId);
      setMessages([]);
      setErrorMessage(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Gemini AI Botanist
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950 font-display flex items-center gap-2.5">
            <span>AI Plant Care Assistant</span>
          </h1>
          <p className="mt-1 text-sm text-stone-600 max-w-2xl">
            Get personalized, context-aware answers grounded in your real plant schedules, health observations, and growth history.
          </p>
        </div>

        {/* Clear Chat Button */}
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-stone-200/80 rounded-lg transition-colors shadow-2xs self-start sm:self-auto"
            title="Start a new chat session"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Context Selector & Plant Badge */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                Select Conversation Context
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedContextId('general')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    selectedContextId === 'general'
                      ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>General (All Plants)</span>
                  </div>
                  <span className="text-[10px] opacity-80">{plants.length} plants</span>
                </button>

                {plants.map((plant) => {
                  const isSelected = selectedContextId === plant.id;
                  const plantHealth = calculatePlantHealthScore(plant, allAssessments, allGrowthRecords);
                  return (
                    <button
                      key={plant.id}
                      type="button"
                      onClick={() => setSelectedContextId(plant.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                          : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate">{plant.name}</div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-stone-400'}`}>
                          {plant.room}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <HealthScoreBadge score={plantHealth.totalScore} size="xs" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Plant Snapshot Card (if individual plant selected) */}
            {selectedPlant && selectedPlantHealth && (
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Active Context Summary
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900">{selectedPlant.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono text-stone-600 border border-stone-200">
                      Score: {selectedPlantHealth.totalScore}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 leading-tight">
                    {selectedPlant.light} · Water every {selectedPlant.wateringFrequencyDays}d
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Next water: {selectedPlantHealth.factors[0]?.detail || 'On schedule'}
                  </div>
                  {onNavigateToPlantDetail && (
                    <button
                      onClick={() => onNavigateToPlantDetail(selectedPlant)}
                      className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1 pt-1"
                    >
                      <span>View details & routines</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl border border-stone-200/80 shadow-xs min-h-[580px] max-h-[750px] overflow-hidden">
          {/* Chat Window Subheader */}
          <div className="px-5 py-3.5 border-b border-stone-200/80 bg-stone-50/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-900 truncate">
                  {selectedPlant ? `Conversation for ${selectedPlant.name}` : 'General Plant Care Consultation'}
                </div>
                <div className="text-[10px] text-stone-500 truncate">
                  {selectedPlant
                    ? `${selectedPlant.species} · ${selectedPlant.room}`
                    : 'Grounded across your entire collection'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-500 hidden sm:inline-block">Powered by Gemini 3.8 Flash</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-stone-50/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Leaf className="w-7 h-7" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-semibold text-stone-900 font-display">
                    {selectedPlant ? `Ask about ${selectedPlant.name}` : 'Ask Anything About Your Plant Oasis'}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {selectedPlant
                      ? `I have your latest care intervals, health score (${selectedPlantHealth?.totalScore}/100), and growth history loaded.`
                      : 'Ask me which plants need watering, compare growth trends, or get solutions for common indoor plant care questions.'}
                  </p>
                </div>

                {/* Suggested Questions in Empty State */}
                <div className="w-full max-w-lg pt-2 space-y-2">
                  <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider text-left">
                    Suggested Questions
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="p-3 text-xs bg-white hover:bg-emerald-50/80 border border-stone-200/80 hover:border-emerald-600/60 rounded-xl transition-all text-stone-700 hover:text-emerald-950 flex items-start gap-2 shadow-2xs group"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span className="leading-snug">{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-2xs text-xs space-y-1.5 ${
                          isUser
                            ? 'bg-emerald-800 text-white rounded-tr-xs'
                            : msg.isError
                            ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-xs'
                            : 'bg-white border border-stone-200/80 text-stone-800 rounded-tl-xs'
                        }`}
                      >
                        {/* Context Tag if tied to plant */}
                        {msg.plantName && (
                          <div className={`text-[10px] font-semibold pb-1 flex items-center gap-1 border-b ${
                            isUser ? 'text-emerald-200 border-emerald-700' : 'text-stone-400 border-stone-100'
                          }`}>
                            <Leaf className="w-3 h-3" />
                            <span>{msg.plantName}</span>
                          </div>
                        )}

                        {/* Content text with formatted paragraphs & bullets */}
                        <div className="leading-relaxed whitespace-pre-wrap font-sans">
                          {msg.content}
                        </div>

                        {/* Timestamp */}
                        <div
                          className={`text-[9px] text-right font-mono tabular-nums pt-1 ${
                            isUser ? 'text-emerald-300' : 'text-stone-400'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3 justify-start items-center">
                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs animate-pulse">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-stone-200/80 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs flex items-center gap-2.5 text-xs text-stone-600">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                      <span className="text-[11px] text-stone-500">
                        Botanist analyzing records & composing advice...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Suggested prompts strip above input if conversation already ongoing */}
          {messages.length > 0 && !isLoading && (
            <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-semibold text-stone-400 shrink-0">Ask next:</span>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="px-2.5 py-1 text-[11px] font-medium text-emerald-900 bg-white hover:bg-emerald-50 border border-stone-200 rounded-full whitespace-nowrap shrink-0 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Error Banner if error occurred */}
          {errorMessage && (
            <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded transition-colors shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Input Box Footer */}
          <div className="p-4 border-t border-stone-200/80 bg-white">
            <div className="relative flex items-end gap-2 bg-stone-50 border border-stone-200/90 rounded-xl p-2 focus-within:ring-2 focus-within:ring-emerald-700/20 focus-within:border-emerald-700 transition-all">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedPlant
                    ? `Ask about ${selectedPlant.name} (e.g., "Why are leaves yellowing?", "When to fertilize?")...`
                    : 'Ask about any plant, watering schedule, or growth questions...'
                }
                disabled={isLoading}
                className="w-full resize-none text-xs sm:text-sm bg-transparent border-0 focus:outline-none p-1 text-stone-800 placeholder:text-stone-400 max-h-32 min-h-[36px]"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputPrompt.trim()}
                className="p-2 text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-stone-300 disabled:text-stone-500 rounded-lg shadow-xs transition-colors shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 text-[10px] text-stone-400">
              <div className="flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-stone-400" />
                <span>Advice only; does not silently modify care logs or schedules.</span>
              </div>
              <span className="hidden sm:inline">Press Enter to send · Shift+Enter for newline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
