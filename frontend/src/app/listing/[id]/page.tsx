"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import HeadBar from "@/components/HeadBar";
import {
  BiMap,
  BiUser,
  BiPhone,
  BiMoney,
  BiTime,
  BiCategory,
} from "react-icons/bi";

interface Listing {
  id: string;
  title: string;
  description: string;
  category?: string;
  price_pence: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  postcode?: string;
  status: string;
  views_count: number;
  created_at: string;
  updated_at: string;
  seller_name: string;
  seller_phone: string;
  images: { id: string; url: string; position: number }[];
}

export default function ListingPage() {
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch the listing from API
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listing/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch listing");
        setListing(data.listing);
      } catch (err: any) {
        console.error("Listing fetch error:", err);
        setError(err.message || "Could not load listing.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchListing();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <HeadBar />
        <div className="flex justify-center items-center h-[80vh] text-gray-500 text-lg">
          Loading listing...
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-gray-50">
        <HeadBar />
        <div className="flex justify-center items-center h-[80vh] text-red-500 text-lg">
          {error || "Listing not found"}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <HeadBar />
      <div className="max-w-6xl mx-auto mt-8 bg-white shadow-md rounded-xl overflow-hidden">
        {/* 🖼️ Image Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
          {listing.images && listing.images.length > 0 ? (
            listing.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt={listing.title}
                className="object-cover w-full h-64"
              />
            ))
          ) : (
            <img
              src="/window.svg"
              alt="No image available"
              className="object-contain w-full h-64"
            />
          )}
        </div>

        {/* 📄 Listing Details */}
        <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-3 sm:mb-0">
              {listing.title}
            </h1>
            <span className="text-2xl font-semibold text-blue-600">
              £{(listing.price_pence / 100).toFixed(2)}
            </span>
          </div>

          <p className="text-gray-700 leading-relaxed mb-6">
            {listing.description}
          </p>

          {/* 📦 Meta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
              <BiCategory size={22} className="text-gray-500" />
              <span className="text-gray-800">
                <b>Category:</b> {listing.category || "Uncategorized"}
              </span>
            </div>

            <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
              <BiMap size={22} className="text-gray-500" />
              <span className="text-gray-800">
                <b>Location:</b>{" "}
                {listing.address || listing.postcode || "Unknown"}
              </span>
            </div>

            <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
              <BiMoney size={22} className="text-gray-500" />
              <span className="text-gray-800">
                <b>Status:</b>{" "}
                <span
                  className={`${
                    listing.status === "active"
                      ? "text-green-600"
                      : "text-gray-600"
                  } font-medium`}
                >
                  {listing.status}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
              <BiTime size={22} className="text-gray-500" />
              <span className="text-gray-800">
                <b>Listed on:</b>{" "}
                {new Date(listing.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
              <BiUser size={22} className="text-gray-500" />
              <span className="text-gray-800">
                <b>Seller:</b> {listing.seller_name}
              </span>
            </div>

            <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
              <BiPhone size={22} className="text-gray-500" />
              <span className="text-gray-800">
                <b>Contact:</b> {listing.seller_phone}
              </span>
            </div>
          </div>

          {/* 👁️ Views count */}
          <p className="text-sm text-gray-500">
            {listing.views_count} views · Last updated{" "}
            {new Date(listing.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </main>
  );
}
