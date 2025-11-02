"use client";

import React, { useState } from "react";
import { BiSearch } from "react-icons/bi";

interface SideBarProps {
  filters: {
    location: string;
    priceRange: number[];
    selectedCategories: string[];
    radius: number;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      location: string;
      priceRange: number[];
      selectedCategories: string[];
      radius: number;
    }>
  >;
  minPrice: number;
  maxPrice: number;
  availableCategories: string[]; // ✅ new prop
}

const SideBar: React.FC<SideBarProps> = ({
  filters,
  setFilters,
  minPrice,
  maxPrice,
  availableCategories,
}) => {
  const [categoryQuery, setCategoryQuery] = useState("");

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

      {/* 📍 Distance Filter */}
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-700 mb-2">
          Distance from you
        </h2>
        <select
          value={filters.radius}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              radius: Number(e.target.value),
            }))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none text-gray-700 bg-white"
        >
          <option value={5}>Within 5 miles</option>
          <option value={10}>Within 10 miles</option>
          <option value={15}>Within 15 miles</option>
          <option value={20}>Within 20 miles</option>
          <option value={0}>All</option>
        </select>
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
            radius: 5, // reset to default
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
