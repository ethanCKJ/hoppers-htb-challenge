"use client";

import React, { useState, useEffect } from "react";
import HeadBar from "@/components/HeadBar";
import ListingsGrid from "@/components/Listings";
import SideBar from "@/components/SideBar";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export default function Home() {
  // 🧭 Shared filters state (start empty)
  const [filters, setFilters] = useState({
    priceRange: [0, 0],
    selectedCategories: [] as string[],
    radius: 5, // ✅ new field (default 5 miles)
  });


  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 0]); // store lowest + highest price in DB
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  useEffect(() => {
    // Get user's current position (if allowed)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => console.warn("Could not get location:", err),
      { enableHighAccuracy: true }
    );
  }, []);


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
      if (filters.priceRange[0] > 0)
        params.append("minPrice", String(filters.priceRange[0] * 100));
      if (filters.priceRange[1] > 0)
        params.append("maxPrice", String(filters.priceRange[1] * 100));
      if (filters.radius > 0)
        params.append("radius", String(filters.radius));

      const res = await fetch(`/api/listing?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch listings");

      let allListings = data.listings || [];
      // 🧮 If user location and radius are set, filter locally
      if (userLocation && filters.radius > 0) {
        allListings = allListings.filter((l: any) => {
          if (!l.latitude || !l.longitude) return false;
          const distance = haversineDistance(
            userLocation.lat,
            userLocation.lon,
            l.latitude,
            l.longitude
          );
          return distance <= filters.radius;
        });
      }
      setListings(allListings);

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
