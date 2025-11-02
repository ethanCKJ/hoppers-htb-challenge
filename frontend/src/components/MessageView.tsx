"use client";

import React, { useState, useEffect, useRef } from "react";
import { BiArrowBack, BiSend, BiPackage } from "react-icons/bi";
import type { Conversation } from "./InboxModal";

interface MessageViewProps {
  conversation: Conversation;
  onBack: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  type: "user" | "system";
  body: string;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
  sender_name: string;
  is_mine: boolean;
}

interface ConversationDetails {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_price: number;
  seller_name: string;
  buyer_name: string;
  my_role: "buyer" | "seller";
  status: string;
}

const MessageView: React.FC<MessageViewProps> = ({ conversation, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setConversationDetails(data.conversation);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchMessages();
    // Poll every 5 seconds for new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversation.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: messageText }),
      });

      if (response.ok) {
        setMessageText("");
        // Immediately fetch new messages
        await fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatPrice = (pricePence: number) => {
    return `£${(pricePence / 100).toFixed(2)}`;
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Determine header name based on role
  const getHeaderName = () => {
    if (!conversationDetails) return "";
    if (conversationDetails.my_role === "buyer") {
      return `${conversationDetails.seller_name} (seller)`;
    } else {
      return `${conversationDetails.buyer_name} (buyer)`;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b bg-white">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <BiArrowBack size={24} className="text-gray-600" />
        </button>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">
            {getHeaderName()}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BiPackage size={16} />
            <span>{conversation.listing_title}</span>
            <span className="text-blue-600 font-medium">
              {formatPrice(conversation.listing_price)}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.is_mine ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] ${
                    message.type === "system"
                      ? "mx-auto"
                      : message.is_mine
                      ? ""
                      : ""
                  }`}
                >
                  {/* System message */}
                  {message.type === "system" ? (
                    <div className="text-center">
                      <div className="inline-block bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full">
                        {message.body}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  ) : (
                    /* User message */
                    <div>
                      {!message.is_mine && (
                        <div className="text-xs text-gray-500 mb-1">
                          {message.sender_name}
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          message.is_mine
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-900 border border-gray-200"
                        }`}
                      >
                        {message.body}
                      </div>
                      <div
                        className={`text-xs text-gray-400 mt-1 ${
                          message.is_mine ? "text-right" : ""
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t bg-white px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-600 transition"
            disabled={sending || conversation.status === "closed"}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending || conversation.status === "closed"}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <BiSend size={20} />
            <span>Send</span>
          </button>
        </form>
        {conversation.status === "closed" && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            This conversation has been closed
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageView;
