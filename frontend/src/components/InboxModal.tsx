"use client";

import React, { useState, useEffect } from "react";
import { BiX, BiChat } from "react-icons/bi";
import ConversationList from "./ConversationList";
import MessageView from "./MessageView";

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface Conversation {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  status: string;
  last_message_at: string;
  created_at: string;
  listing_title: string;
  listing_price: number;
  listing_status: string;
  seller_name: string;
  buyer_name: string;
  my_role: "buyer" | "seller";
  other_party_name: string;
  other_party_id: string;
  last_message: {
    id: string;
    body: string;
    type: string;
    sender_id: string;
    created_at: string;
  } | null;
  listing_image: string | null;
}

interface ConversationsData {
  buyer_conversations: Conversation[];
  seller_conversations: Conversation[];
}

const InboxModal: React.FC<InboxModalProps> = ({ isOpen, onClose }) => {
  const [conversationsData, setConversationsData] = useState<ConversationsData>({
    buyer_conversations: [],
    seller_conversations: [],
  });
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversationsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      // Poll every 10 seconds
      const interval = setInterval(fetchConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Get selected conversation
  const selectedConversation = [
    ...conversationsData.buyer_conversations,
    ...conversationsData.seller_conversations,
  ].find((conv) => conv.id === selectedConversationId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <BiChat size={28} className="text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Inbox</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <BiX size={28} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {selectedConversationId && selectedConversation ? (
            // Message View
            <MessageView
              conversation={selectedConversation}
              onBack={() => setSelectedConversationId(null)}
            />
          ) : (
            // Conversation List
            <ConversationList
              buyerConversations={conversationsData.buyer_conversations}
              sellerConversations={conversationsData.seller_conversations}
              onSelectConversation={setSelectedConversationId}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxModal;
