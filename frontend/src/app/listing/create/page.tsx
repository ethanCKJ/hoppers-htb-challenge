"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BiUpload, BiX, BiCurrentLocation } from "react-icons/bi";

export default function CreateListingPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    address: "",
    postcode: "",
  });

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🧠 Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Restrict category to one word (no spaces)
    if (name === "category") {
      const singleWord = value.replace(/\s+/g, "");
      setForm((prev) => ({ ...prev, category: singleWord }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 📸 Handle image uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // 📍 Detect current location
  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setError("");
      },
      (err) => {
        console.error("Location error:", err);
        setError("Failed to get your current location. Please enter it manually.");
      },
      { enableHighAccuracy: true }
    );
  };

  // 🚀 Handle submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate required fields
    if (!form.title || !form.description || !form.price || !form.category) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^[A-Za-z0-9_-]+$/.test(form.category)) {
      setError("Category must be a single word (letters, numbers, hyphen or underscore only).");
      return;
    }

    if (!coords && (!form.address || !form.postcode)) {
      setError("Please provide a location or allow location access.");
      return;
    }

    setLoading(true);
    try {
      const uploadedFiles: string[] = [];

      // 🖼️ Upload images first
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        uploadedFiles.push(data.filename);
      }

      // 🧾 Create listing
      const res = await fetch("/api/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category.trim(),
          price_pence: parseInt(form.price) * 100,
          latitude: coords?.lat,
          longitude: coords?.lon,
          address: form.address || null,
          postcode: form.postcode || null,
          hide_exact_location: false,
          images: uploadedFiles,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create listing");

      setSuccess("Listing created successfully!");
      setTimeout(() => router.push(`/listing/${data.listing.id}`), 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Create New Listing
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm mb-3">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 px-3 py-2 rounded-md text-sm mb-3">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 🏷️ Title */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Blue Office Chair"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 📝 Description */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your item..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 📦 Category (one word enforced) */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Category (one word) *
            </label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="e.g. Electronics"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only one word allowed (e.g. <i>Furniture</i> or <i>Books</i>)
            </p>
          </div>

          {/* 📍 Location */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Location *</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street address"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                name="postcode"
                value={form.postcode}
                onChange={handleChange}
                placeholder="Postcode"
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <BiCurrentLocation /> Use current location
            </button>

            {coords && (
              <p className="text-sm text-gray-500 mt-1">
                📍 Latitude: {coords.lat.toFixed(4)}, Longitude: {coords.lon.toFixed(4)}
              </p>
            )}
          </div>

          {/* 💰 Price */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Price (£) *</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="e.g. 50"
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 📸 Images */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Images</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <BiUpload size={20} />
                Upload Images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500">{files.length} selected</p>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${i + 1}`}
                      className="h-32 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <BiX size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating..." : "Create Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}
