"use client";

import React from "react";
import { BiLogIn, BiSearch, BiUserCircle } from "react-icons/bi";

const HeadBar = () => {
  return (
    <header
      id="headbar"
      className="flex items-center justify-between bg-white py-3 px-6 shadow-sm sticky top-0 z-50"
    >
      {/* 🏠 Logo / Title */}
      <div className="flex items-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
          Neighbourhood Market
        </h1>
      </div>

      {/* 🔍 Search bar (hidden on small screens) */}
      <div className="hidden sm:flex flex-1 justify-center px-6">
        <div className="flex items-center w-full max-w-md border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-400 transition">
          <BiSearch size={22} className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search for products..."
            className="w-full text-gray-700 text-base md:text-lg focus:outline-none placeholder-gray-400"
          />
        </div>
      </div>

      {/* 👤 Login / Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button className="flex items-center rounded-xl px-3 py-2 bg-blue-600 hover:bg-blue-700 transition shadow-sm">
          <BiUserCircle size={26} className="text-white mr-2" />
          <span className="text-base md:text-lg font-medium text-white">Login</span>
        </button>

        <button className="flex items-center rounded-xl px-3 py-2 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 transition shadow-sm">
          <BiLogIn size={26} className="text-blue-600 mr-2" />
          <span className="text-base md:text-lg font-medium text-blue-600">Sign Up</span>
        </button>
      </div>
    </header>
  );
};

export default HeadBar;
