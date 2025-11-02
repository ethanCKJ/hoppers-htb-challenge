"use client";

import React, { useEffect, useState } from "react";
import {
  BiUserCircle,
  BiMap,
  BiPhone,
  BiEnvelope,
  BiLogOut,
} from "react-icons/bi";
import HeadBar from "@/components/HeadBar";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  lat: number;
  lng: number;
  created_at: string;
  updated_at: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  price_pence: number;
  images: { url: string }[];
  status: string;
  created_at: string;
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingListings, setLoadingListings] = useState(false);
  const router = useRouter();

  // 🧾 Fetch profile from /api/user/profile
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile", { credentials: "include" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");

      setProfile(data.profile);
    } catch (err: any) {
      console.error("Profile error:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // 🏷️ Fetch listings belonging to this user
  const fetchUserListings = async (userId: string) => {
    try {
      setLoadingListings(true);
      const res = await fetch(`/api/listing?sellerId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch listings");
      setListings(data.listings);
    } catch (err: any) {
      console.error("Listings fetch error:", err);
    } finally {
      setLoadingListings(false);
    }
  };

  // 🚪 Logout user
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        alert(data.error || "Logout failed");
      }
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Something went wrong while logging out.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch listings after profile loads
  useEffect(() => {
    if (profile?.id) {
      fetchUserListings(profile.id);
    }
  }, [profile]);

  return (
    <main className="min-h-screen bg-gray-50">
      <HeadBar />
      <div className="max-w-5xl mx-auto mt-10 bg-white shadow-md rounded-xl p-8">
        {loading ? (
          <div className="text-center text-gray-600 text-lg py-10">
            Loading profile...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-lg py-10">{error}</div>
        ) : profile ? (
          <>
            {/* Profile Header */}
            <div className="items-center flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="flex items-center gap-6">
                <BiUserCircle size={100} className="text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {profile.name}
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Member since{" "}
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* 🚪 Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                <BiLogOut size={22} />
                <span className="font-medium">Logout</span>
              </button>
            </div>

            {/* Contact Info */}
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <div className="flex items-center border border-gray-200 rounded-lg p-4">
                <BiEnvelope size={26} className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-800">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center border border-gray-200 rounded-lg p-4">
                <BiPhone size={26} className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-800">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-center border border-gray-200 rounded-lg p-4 sm:col-span-2">
                <BiMap size={26} className="text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Location (approx.)</p>
                  <p className="text-gray-800">
                    Latitude: {Number(profile.lat)?.toFixed(4)}, Longitude:{" "}
                    {Number(profile.lng)?.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t my-8"></div>

            {/* My Listings Section */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                My Listings
              </h2>

              {loadingListings ? (
                <p className="text-gray-500 text-center py-5">
                  Loading your listings...
                </p>
              ) : listings.length === 0 ? (
                <p className="text-gray-600">
                  You haven’t created any listings yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {listings.map((l) => (
                    <Link
                      href={`/listing/${l.id}`}
                      key={l.id}
                      className="block border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition bg-white"
                    >
                      <img
                        src={
                          l.images && l.images.length > 0
                            ? l.images[0].url
                            : "/window.svg"
                        }
                        alt={l.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-800 truncate">
                          {l.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2 capitalize">
                          {l.category || "Uncategorized"}
                        </p>
                        <p className="text-blue-600 font-semibold">
                          £{(l.price_pence / 100).toFixed(2)}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            l.status === "active"
                              ? "text-green-600"
                              : l.status === "sold"
                              ? "text-gray-400"
                              : "text-yellow-600"
                          }`}
                        >
                          {l.status.toUpperCase()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-10">
            No profile data found.
          </div>
        )}
      </div>
    </main>
  );
};

export default ProfilePage;
