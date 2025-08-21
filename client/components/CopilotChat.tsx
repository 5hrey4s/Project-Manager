'use client';

import { useState, FormEvent } from 'react';
import axios from 'axios';

// Define the structure of a chat message
interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface CopilotChatProps {
  projectId: string;
  onClose: () => void; // Function to close the chat window
}

export default function CopilotChat({ projectId, onClose }: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/copilot`,
        { projectId: parseInt(projectId, 10), message: input },
        { headers: { 'x-auth-token': token } }
      );
      
      const aiMessage: Message = { sender: 'ai', text: response.data.reply };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      const errorMessage: Message = { sender: 'ai', text: "Sorry, I couldn't process that. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
      console.error("Copilot request failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md bg-white rounded-lg shadow-2xl z-50 flex flex-col h-[600px]">
      <header className="bg-indigo-600 text-white p-4 flex justify-between items-center rounded-t-lg">
        <h2 className="font-bold text-lg">🤖 AI Project Copilot</h2>
        <button onClick={onClose} className="font-bold text-2xl">&times;</button>
      </header>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-xl bg-gray-200 text-gray-800">
                    <p className="animate-pulse">Thinking...</p>
                </div>
            </div>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your project..."
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-400">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}