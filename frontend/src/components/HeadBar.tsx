"use client";

import { useEffect, useState } from "react";
import { BiLogIn, BiSearch, BiUserCircle, BiEnvelope, BiUser } from "react-icons/bi";
import InboxModal from "./InboxModal";
import Link from "next/link";

const HeadBar = () => {
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Check login via backend API instead of document.cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/user", {
          method: "GET",
          credentials: "include", // 👈 ensures cookies are sent with request
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <>
      <header
        id="headbar"
        className="flex items-center justify-between bg-white py-3 px-6 shadow-sm sticky top-0 z-50"
      >
        {/* 🏠 Logo / Title */}
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
              Neighbourhood Market
            </h1>
          </div>
        </Link>

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

        {/* 🔐 Right-side buttons */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {isLoggedIn ? (
            <>
              {/* 📬 Inbox */}
              <button
                onClick={() => setIsInboxOpen(true)}
                className="flex items-center rounded-xl px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition shadow-sm"
                title="Inbox"
              >
                <BiEnvelope size={26} className="text-gray-700" />
                <span className="hidden sm:inline text-base md:text-lg font-medium text-gray-700 ml-2">
                  Inbox
                </span>
              </button>

              {/* 👤 Profile */}
              <Link href="/profile">
                <button className="flex items-center rounded-xl px-3 py-2 bg-blue-600 hover:bg-blue-700 transition shadow-sm">
                  <BiUser size={26} className="text-white mr-2" />
                  <span className="text-base md:text-lg font-medium text-white">
                    Profile
                  </span>
                </button>
              </Link>
            </>
          ) : (
            <>
              {/* 🔑 Login */}
              <Link href="/login">
                <button className="flex items-center rounded-xl px-3 py-2 bg-blue-600 hover:bg-blue-700 transition shadow-sm">
                  <BiUserCircle size={26} className="text-white mr-2" />
                  <span className="text-base md:text-lg font-medium text-white">
                    Login
                  </span>
                </button>
              </Link>

              {/* 📝 Sign Up */}
              <Link href="/register">
                <button className="flex items-center rounded-xl px-3 py-2 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 transition shadow-sm">
                  <BiLogIn size={26} className="text-blue-600 mr-2" />
                  <span className="text-base md:text-lg font-medium text-blue-600">
                    Sign Up
                  </span>
                </button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 📬 Inbox Modal */}
      <InboxModal isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} />
    </>
  );
};

export default HeadBar;
