"use client";

import React, { useState } from "react";
import { BiSearch } from "react-icons/bi";

interface SideBarProps {
  filters: {
    location: string;
    priceRange: number[];
    selectedCategories: string[];
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      location: string;
      priceRange: number[];
      selectedCategories: string[];
    }>
  >;
  minPrice: number; // ✅ new prop
  maxPrice: number; // ✅ new prop
}

const SideBar: React.FC<SideBarProps> = ({
  filters,
  setFilters,
  minPrice,
  maxPrice,
}) => {
  const [categoryQuery, setCategoryQuery] = useState("");

  const availableCategories = [
    "Electronics",
    "Books",
    "Furniture",
    "Clothing",
    "Appliances",
    "Sports",
  ];

  const filteredCategories = availableCategories.filter((cat) =>
    cat.toLowerCase().includes(categoryQuery.toLowerCase())
  );

  const toggleCategory = (cat: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(cat)
        ? prev.selectedCategories.filter((c) => c !== cat)
        : [...prev.selectedCategories, cat],
    }));
  };

  return (
    <aside className="flex flex-col w-full sm:w-72 bg-white shadow-lg p-5 h-full">
      <h1 className="text-3xl font-semibold text-gray-800 mb-3">Filters</h1>

      {/* 📍 Location Filter */}
      <div>
        <h2 className="text-lg font-medium text-gray-700 mb-2">Location</h2>
        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 mb-4">
          <BiSearch size={20} className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search location..."
            value={filters.location}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, location: e.target.value }))
            }
            className="w-full focus:outline-none text-gray-700"
          />
        </div>

        {filters.location && (
          <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg max-h-32 overflow-y-auto text-sm">
            {["Sheffield", "Manchester", "Leeds", "Nottingham"]
              .filter((loc) =>
                loc.toLowerCase().includes(filters.location.toLowerCase())
              )
              .map((loc) => (
                <div
                  key={loc}
                  className="p-2 hover:bg-blue-100 cursor-pointer rounded-md"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, location: loc }))
                  }
                >
                  {loc}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 💰 Price Filter */}
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-700 mb-2">
          Price Range (£)
        </h2>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={minPrice}
            max={filters.priceRange[1]}
            value={filters.priceRange[0]}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                priceRange: [Number(e.target.value), prev.priceRange[1]],
              }))
            }
            className="w-16 border border-gray-300 rounded-md text-center"
          />
          <span>–</span>
          <input
            type="number"
            min={filters.priceRange[0]}
            max={maxPrice}
            value={filters.priceRange[1]}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                priceRange: [prev.priceRange[0], Number(e.target.value)],
              }))
            }
            className="w-16 border border-gray-300 rounded-md text-center"
          />
        </div>

        <p className="text-sm text-gray-500 mt-1">
          Min: £{minPrice.toFixed(2)} | Max: £{maxPrice.toFixed(2)}
        </p>
      </div>

      {/* 🏷️ Category Filter */}
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-700 mb-2">Category</h2>
        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 mb-2">
          <BiSearch size={20} className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search categories..."
            value={categoryQuery}
            onChange={(e) => setCategoryQuery(e.target.value)}
            className="w-full focus:outline-none text-gray-700"
          />
        </div>

        <div className="space-y-1 max-h-40 overflow-y-auto">
          {filteredCategories.map((cat) => (
            <div key={cat} className="flex items-center">
              <input
                id={cat}
                type="checkbox"
                checked={filters.selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="mr-2 accent-blue-600"
              />
              <label htmlFor={cat} className="text-gray-700 cursor-pointer">
                {cat}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* 🧹 Clear All */}
      <button
        onClick={() =>
          setFilters({
            location: "",
            priceRange: [minPrice, maxPrice],
            selectedCategories: [],
          })
        }
        className="mt-4 text-blue-600 font-semibold hover:underline self-start"
      >
        Clear All Filters
      </button>
    </aside>
  );
};

export default SideBar;
