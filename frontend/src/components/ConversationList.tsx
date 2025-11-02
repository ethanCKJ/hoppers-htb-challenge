"use client";

import React, { useEffect, useState } from "react";
import { BiUser, BiPackage, BiChat } from "react-icons/bi";
import type { Conversation } from "./InboxModal";

interface ConversationListProps {
  buyerConversations: Conversation[];
  sellerConversations: Conversation[];
  onSelectConversation: (id: string) => void;
  loading: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  buyerConversations,
  sellerConversations,
  onSelectConversation,
  loading,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // mark component as mounted so we only render time-sensitive values on the client
    // defer setState to the next tick to avoid synchronous state update in effect
    const t = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  const formatPrice = (pricePence: number) => {
    return `£${(pricePence / 100).toFixed(2)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const ConversationItem: React.FC<{ conversation: Conversation }> = ({
    conversation,
  }) => {
    const roleLabel = conversation.my_role === "buyer" ? "(seller)" : "(buyer)";

    return (
      <div
        onClick={() => onSelectConversation(conversation.id)}
        className="flex items-start gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b transition"
      >
        {/* Listing Image */}
        <div className="flex-shrink-0">
          {conversation.listing_image ? (
            <img
              src={conversation.listing_image}
              alt={conversation.listing_title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <BiPackage size={32} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Listing Title */}
          <h3 className="font-semibold text-gray-900 truncate text-sm">
            {conversation.listing_title}
          </h3>

          {/* Other Party Name */}
          <div className="flex items-center gap-1 mt-1">
            <BiUser size={16} className="text-gray-500" />
            <p className="text-sm text-gray-600">
              {conversation.other_party_name}{" "}
              <span className="text-gray-400">{roleLabel}</span>
            </p>
          </div>

          {/* Last Message */}
          {conversation.last_message && (
            <p className="text-sm text-gray-500 truncate mt-1">
              {conversation.last_message.body}
            </p>
          )}

          {/* Price */}
          <p className="text-xs text-blue-600 font-medium mt-1">
            {formatPrice(conversation.listing_price)}
          </p>
        </div>

        {/* Timestamp */}
        <div className="flex-shrink-0 text-xs text-gray-400">
          {conversation.last_message_at && (isMounted ? formatTimestamp(conversation.last_message_at) : "")}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  const totalConversations =
    buyerConversations.length + sellerConversations.length;

  if (totalConversations === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <BiChat size={64} className="text-gray-300 mb-4" />
        <p className="text-lg">No conversations yet</p>
        <p className="text-sm">
          Start chatting with sellers to see conversations here
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* As Buyer Section */}
      {buyerConversations.length > 0 && (
        <div>
          <div className="sticky top-0 bg-gray-100 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold text-gray-700">
              As Buyer ({buyerConversations.length})
            </h3>
          </div>
          {buyerConversations.map((conversation) => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
        </div>
      )}

      {/* As Seller Section */}
      {sellerConversations.length > 0 && (
        <div>
          <div className="sticky top-0 bg-gray-100 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold text-gray-700">
              As Seller ({sellerConversations.length})
            </h3>
          </div>
          {sellerConversations.map((conversation) => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationList;
