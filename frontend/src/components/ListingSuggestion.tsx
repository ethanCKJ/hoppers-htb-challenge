"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BiCheckCircle, BiPackage } from "react-icons/bi";

interface ListingSuggestionProps {
  listingId: string;
  reason: string;
}

interface ListingData {
  id: string;
  title: string;
  price_pence: number;
  images: Array<{ url: string }>;
  category?: string;
}

const ListingSuggestion: React.FC<ListingSuggestionProps> = ({
  listingId,
  reason,
}) => {
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listing/${listingId}`);
        if (response.ok) {
          const data = await response.json();
          setListing(data.listing);
        }
      } catch (error) {
        console.error("Failed to fetch listing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 animate-pulse">
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-gray-200 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const formatPrice = (pricePence: number) => {
    return `£${(pricePence / 100).toFixed(2)}`;
  };

  return (
    <Link href={`/listing/${listingId}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 hover:border-blue-500 hover:shadow-md transition cursor-pointer">
        <div className="flex gap-3">
          {/* Listing Image */}
          <div className="flex-shrink-0">
            {listing.images && listing.images.length > 0 ? (
              <img
                src={listing.images[0].url}
                alt={listing.title}
                className="w-20 h-20 object-cover rounded"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                <BiPackage size={32} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Listing Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {listing.title}
            </h4>
            <p className="text-blue-600 font-bold text-sm mt-1">
              {formatPrice(listing.price_pence)}
            </p>
            {listing.category && (
              <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1">
                {listing.category}
              </span>
            )}
          </div>
        </div>

        {/* Bot's Recommendation Reason */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <BiCheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">{reason}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingSuggestion;
