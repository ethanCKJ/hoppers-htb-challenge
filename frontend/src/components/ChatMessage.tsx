"use client";

import React from "react";
import { BiBot, BiUser } from "react-icons/bi";
import ListingSuggestion from "./ListingSuggestion";

interface RecommendedListing {
  listing_id: string;
  reason: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  recommendedListings?: RecommendedListing[];
  timestamp?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  recommendedListings,
  timestamp,
}) => {
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%]">
          <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 inline-block">
            <p className="text-sm">{content}</p>
          </div>
          {timestamp && (
            <p className="text-xs text-gray-400 text-right mt-1">
              {formatTime(timestamp)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-start gap-2 mb-4">
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
        <BiBot size={18} className="text-gray-600" />
      </div>

      {/* Message Content */}
      <div className="flex-1 max-w-[80%]">
        {/* Text Response */}
        {content && (
          <div className="bg-gray-100 rounded-2xl px-4 py-2 inline-block">
            <p className="text-sm text-gray-800">{content}</p>
          </div>
        )}

        {/* Listing Recommendations */}
        {recommendedListings && recommendedListings.length > 0 && (
          <div className="mt-3">
            {recommendedListings.map((listing) => (
              <ListingSuggestion
                key={listing.listing_id}
                listingId={listing.listing_id}
                reason={listing.reason}
              />
            ))}
          </div>
        )}

        {timestamp && (
          <p className="text-xs text-gray-400 mt-1">{formatTime(timestamp)}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
