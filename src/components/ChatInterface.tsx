import React, { useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader } from 'lucide-react';
import { Message, Client } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  inputMessage: string;
  onInputChange: (message: string) => void;
  onSendMessage: () => void;
  isProcessing: boolean;
  selectedClient: Client | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  inputMessage,
  onInputChange,
  onSendMessage,
  isProcessing,
  selectedClient,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing && inputMessage.trim()) {
      onSendMessage();
    }
  };

  return (
    <div className="lg:col-span-2 flex flex-col bg-gray-50 rounded-lg border border-gray-200 h-[600px]">
      <div className="bg-purple-100 px-4 py-3 border-b border-purple-200 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-purple-700" />
        <h2 className="font-semibold text-purple-900">AI Assistant</h2>
        {selectedClient && (
          <span className="ml-auto text-sm text-purple-700">
            Active: {selectedClient.name}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : msg.role === 'system'
                  ? 'bg-blue-100 text-blue-900 text-sm border border-blue-200'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="text-xs opacity-60 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-gray-600">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedClient
                ? `Managing ${selectedClient.name}... Try: 'Sync all', 'Switch to [client]', 'Check all clients'`
                : 'Select a client to begin'
            }
            disabled={!selectedClient || isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-gray-100"
          />
          <button
            onClick={onSendMessage}
            disabled={!inputMessage.trim() || isProcessing || !selectedClient}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
