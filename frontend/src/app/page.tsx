"use client";

import React, { useState, useMemo } from "react";
import HeadBar from "@/components/HeadBar";
import ListingsGrid from "@/components/Listings";
import SideBar from "@/components/SideBar";

export default function Home() {
  // Shared filters state
  const [filters, setFilters] = useState({
    location: "",
    priceRange: [0, 200],
    selectedCategories: [] as string[],
  });

  // Mock data (replace with API later)
  const listings = [
    {
      id: 1,
      title: "Laptop for Sale",
      price: 450,
      location: "Sheffield",
      category: "Electronics",
      imageUrl: "/mock/laptop.jpg",
    },
    {
      id: 2,
      title: "Used Textbooks Bundle",
      price: 30,
      location: "Manchester",
      category: "Books",
      imageUrl: "/mock/books.jpg",
    },
    {
      id: 3,
      title: "Gaming Chair",
      price: 80,
      location: "Sheffield",
      category: "Furniture",
      imageUrl: "/mock/chair.jpg",
    },
  ];

  // ✅ Correct filtering logic
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchLocation =
        !filters.location ||
        listing.location.toLowerCase().includes(filters.location.toLowerCase());

      const matchPrice =
        listing.price >= filters.priceRange[0] &&
        listing.price <= filters.priceRange[1];

      const matchCategory =
        filters.selectedCategories.length === 0 ||
        filters.selectedCategories.includes(listing.category);

      return matchLocation && matchPrice && matchCategory;
    });
  }, [filters, listings]);

  return (
    <main className="min-h-screen min-w-screen flex">
      <div className="bg-gray-50 w-full">
        <HeadBar />
        <div className="flex flex-row h-full">
          <div className="flex w-fit">
            <SideBar filters={filters} setFilters={setFilters} />
          </div>

          <div className="flex w-full">
            <ListingsGrid listings={filteredListings} />
          </div>
        </div>
      </div>
    </main>
  );
}
