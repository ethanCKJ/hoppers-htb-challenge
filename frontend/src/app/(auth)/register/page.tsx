"use client";

import React, { useState } from "react";
import { BiUser, BiLock, BiMailSend, BiUserPlus } from "react-icons/bi";
import { useRouter } from "next/navigation";
import HeadBar from "@/components/HeadBar";

const RegisterPage = () => {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      // 👇 Replace this with your backend signup endpoint
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Registration failed");

      alert("Account created successfully!");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 ">
        <div className="">
            <HeadBar />
        </div>
        <div className="flex-1 grow flex items-center justify-center self-center">
            <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-8">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    Create your Neighbourhood Market Account
                </h1>

                <form onSubmit={handleSubmit} className="space-y-5 w-xs self-center justify-self-center">
                {error && (
                    <div className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm">
                    {error}
                    </div>
                )}

                {/* Name field */}
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                    <BiUser size={20} className="text-gray-500 mr-2" />
                    <input
                    type="text"
                    name="name"
                    placeholder="Full name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full focus:outline-none text-gray-700"
                    />
                </div>

                {/* Email field */}
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                    <BiMailSend size={20} className="text-gray-500 mr-2" />
                    <input
                    type="email"
                    name="email"
                    placeholder="University email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full focus:outline-none text-gray-700"
                    />
                </div>

                {/* Password field */}
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                    <BiLock size={20} className="text-gray-500 mr-2" />
                    <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full focus:outline-none text-gray-700"
                    />
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition ${
                    loading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                >
                    <BiUserPlus size={22} />
                    {loading ? "Creating account..." : "Sign Up"}
                </button>

                {/* Link to login */}
                <p className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <a
                    href="/login"
                    className="text-blue-600 hover:underline font-medium"
                    >
                    Login
                    </a>
                </p>
                </form>
            </div>
        </div>
    </main>
  );
};

export default RegisterPage;
