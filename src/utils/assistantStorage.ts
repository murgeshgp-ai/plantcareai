import { ChatMessage } from '../types/assistant';

export const ASSISTANT_STORAGE_KEY = 'sproutcare_assistant_chats_v1';

export type ChatHistoryStore = Record<string, ChatMessage[]>;

export function loadAllChatHistories(): ChatHistoryStore {
  try {
    const raw = localStorage.getItem(ASSISTANT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as ChatHistoryStore;
      }
    }
  } catch (err) {
    console.error('Failed to load chat history from localStorage', err);
  }
  return {};
}

export function loadChatForContext(contextId: string): ChatMessage[] {
  const all = loadAllChatHistories();
  return all[contextId] || [];
}

export function saveChatForContext(contextId: string, messages: ChatMessage[]): void {
  try {
    const all = loadAllChatHistories();
    all[contextId] = messages;
    localStorage.setItem(ASSISTANT_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save chat history to localStorage', err);
  }
}

export function clearChatForContext(contextId: string): void {
  try {
    const all = loadAllChatHistories();
    delete all[contextId];
    localStorage.setItem(ASSISTANT_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to clear chat for context', err);
  }
}
