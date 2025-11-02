"use client";

import React, { useState, useEffect, useRef } from "react";
import { BiBot, BiX, BiSend } from "react-icons/bi";
import ChatMessage from "./ChatMessage";

/**
 * Messages in conversation between user and chatbot
 */
interface Message {
  role: "user" | "assistant";
  content: string;
  recommended_listings?: Array<{
    listing_id: string;
    reason: string;
  }>;
  created_at: string;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar enabling chat with AI assistant
 * @param isOpen
 * @param onClose
 * @constructor
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose }) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Send message to bot and append response to chat.
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversation_id: conversationId,
          message: input,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Append bot response to list of messages
      const botMessage: Message = {
        role: "assistant",
        content: data.response || "",
        recommended_listings: data.recommended_listings || [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setConversationId(data.conversation_id);
    } catch (error) {
      console.error("Failed to send message:", error);

      // Show error message
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
      <aside className="w-full sm:w-96 bg-white border-l border-gray-200 shadow-lg flex flex-col h-screen sticky top-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-600">
          <div className="flex items-center gap-2">
            <BiBot size={28} className="text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">AI Assistant</h2>
              <p className="text-xs text-blue-100">Powered by GPT-4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-full transition"
          >
            <BiX size={24} className="text-white" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
          {/* Greeting Message */}
          <div className="text-center mb-2 py-0">
            <h3 className="text-xl font-bold p-0 text-gray-800 mb-2">
              {getGreeting()}!
            </h3>
            {/*<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">*/}
            {/*  <BiBot size={32} className="text-blue-600" />*/}
            {/*</div>*/}
            <p className="text-gray-600">What do you want to find?</p>
          </div>

          {/* Conversation Messages */}
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              recommendedListings={message.recommended_listings}
              timestamp={message.created_at}
            />
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-start gap-2 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <BiBot size={18} className="text-gray-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white px-4 py-3">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-600 transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <BiSend size={20} />
            </button>
          </form>
        </div>
      </aside>
  );
};

export default ChatInterface;
