// app/components/AuthModal.jsx
"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
      alert("Success! You are now logged in.");
    } catch (err) {
      setError(err.message.includes("wrong-password") ? "Wrong password" : "Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-[400px] h-[400px] bg-gradient-to-r from-gray-500/10 via-white/5 to-gray-400/8 rounded-full blur-[80px] animate-pulse" style={{animationDuration: '8s'}} />
        <div className="absolute bottom-1/3 right-1/6 w-[350px] h-[350px] bg-gradient-to-l from-gray-600/8 via-white/3 to-gray-500/5 rounded-full blur-[70px] animate-pulse" style={{animationDuration: '12s', animationDelay: '2s'}} />
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Glassmorphism Container */}
        <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl border border-gray-400/30 shadow-2xl shadow-white/10 p-10 relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-300 via-white to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM2 8a6 6 0 1010.257 5.743L12 14l-0.257-0.257A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">
              {isLogin ? "Welcome Back" : "Join the Simulation"}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin ? "Sign in to your trading account" : "Create your trading account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <input
                type="email"
                placeholder="College Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-4 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 backdrop-blur-sm transition-all duration-300"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-4 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 backdrop-blur-sm transition-all duration-300"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/60 border border-red-600/50 rounded-xl text-red-300 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-gray-300 to-white hover:from-white hover:to-gray-200 text-black rounded-xl transition-all duration-300 shadow-lg hover:shadow-white/30 transform hover:scale-105 disabled:opacity-70 disabled:transform-none"
            >
              {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-300 hover:text-white underline underline-offset-2 transition-colors font-medium"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/50 rounded-full text-gray-400 hover:text-white transition-all hover:rotate-90 hover:scale-110"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}