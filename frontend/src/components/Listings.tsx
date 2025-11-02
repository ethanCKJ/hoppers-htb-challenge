"use client";

import React from "react";

interface Listing {
  id: number;
  title: string;
  price: number;
  location: string;
  category: string;
  imageUrl: string;
}

interface ListingsGridProps {
  listings: Listing[];
}

const ListingsGrid: React.FC<ListingsGridProps> = ({ listings }) => {
  return (
    <section className="flex-1 px-4 sm:px-6 md:px-8 py-4">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        {listings.length > 0 ? "Filtered Listings" : "No Listings Found"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
          >
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-3">
              <p className="text-lg font-semibold text-gray-800">
                £{listing.price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-700 truncate">{listing.title}</p>
              <p className="text-xs text-gray-500">{listing.location}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ListingsGrid;
