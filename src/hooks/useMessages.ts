import { useState, useCallback } from 'react';
import { Message } from '../types';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((role: 'user' | 'assistant' | 'system', content: string) => {
    const newMessage: Message = {
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
  };
};
