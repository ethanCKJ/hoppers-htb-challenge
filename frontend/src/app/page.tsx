"use client";

import React, { useState, useEffect } from "react";
import HeadBar from "@/components/HeadBar";
import ListingsGrid from "@/components/Listings";
import SideBar from "@/components/SideBar";

export default function Home() {
  // 🧭 Shared filters state (start empty; will fill once min/max are fetched)
  const [filters, setFilters] = useState({
    location: "",
    priceRange: [0, 0],
    selectedCategories: [] as string[],
  });

  const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 0]); // store lowest + highest price in DB
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🧮 Fetch min and max prices once on page load
  const fetchPriceRange = async () => {
    try {
      const res = await fetch("/api/listing");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch listings");

      // Extract min and max prices from data
      const prices = data.listings.map((l: any) => l.price_pence / 100);
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      setPriceBounds([min, max]);
      setFilters((prev) => ({ ...prev, priceRange: [min, max] }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not fetch price range.");
    }
  };

  // 🔄 Fetch listings with applied filters
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (filters.location) params.append("keyword", filters.location);
      if (filters.priceRange[0] > 0)
        params.append("minPrice", String(filters.priceRange[0] * 100));
      if (filters.priceRange[1] > 0)
        params.append("maxPrice", String(filters.priceRange[1] * 100));

      const res = await fetch(`/api/listing?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch listings");

      setListings(data.listings || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch lowest/highest prices on mount
  useEffect(() => {
    fetchPriceRange();
  }, []);

  // Refetch listings whenever filters change (after bounds are loaded)
  useEffect(() => {
    if (priceBounds[1] > 0) fetchListings();
  }, [filters]);

  return (
    <main className="min-h-screen min-w-screen flex">
      <div className="bg-gray-50 w-full">
        <HeadBar />
        <div className="flex flex-row h-full">
          <div className="flex w-fit">
            {priceBounds[1] > 0 ? (
              <SideBar
                filters={filters}
                setFilters={setFilters}
                minPrice={priceBounds[0]}
                maxPrice={priceBounds[1]}
              />
            ) : (
              <div className="p-8 text-gray-500">Loading filters...</div>
            )}
          </div>

          <div className="flex w-full">
            {loading ? (
              <div className="w-full flex items-center justify-center text-gray-500 text-lg">
                Loading listings...
              </div>
            ) : error ? (
              <div className="w-full flex items-center justify-center text-red-500 text-lg">
                {error}
              </div>
            ) : (
              <ListingsGrid
                listings={listings.map((l) => ({
                  id: l.id,
                  title: l.title,
                  price: l.price_pence / 100,
                  location: l.address || l.postcode || "Unknown",
                  category: l.category || "Uncategorized",
                  imageUrl:
                    l.images && l.images.length > 0
                      ? l.images[0].url
                      : "/window.svg",
                }))}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
