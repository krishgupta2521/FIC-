"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";
import { 
  TrendingUp, 
  ArrowRight, 
  ChevronRight, 
  Activity, 
  Sparkles, 
  BarChart3,
  Users,
  Timer,
  Shield,
  Target,
  Zap,
  Star,
  X
} from 'lucide-react';

export default function Home() {
  // --- EXISTING STATE (Auth & Modal) ---
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // --- NEW DESIGN STATE (Animations) ---
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animations on load
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // --- AUTH HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Please wait...");

    if (!email || !password) {
      setMessage("Please enter both email and password");
      return;
    }

    try {
      console.log("Attempting login for:", email);
      
      let loginSuccess = false;
      
      // First try Firebase Auth
      try {
        console.log("Trying Firebase Auth...");
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Firebase Auth successful");
        loginSuccess = true;
      } catch (firebaseError) {
        console.log("Firebase auth failed:", firebaseError.message);
        console.log("Trying admin credentials...");
        
        // If Firebase Auth fails, try admin-created user credentials
        try {
          const credentialsRef = ref(db, `userCredentials/${email}`);
          console.log("Checking admin credentials for:", email);
          const snapshot = await get(credentialsRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log("Admin user found:", userData);
            
            if (userData.password === password) {
              console.log("Password matches, logging in...");
              // Store login info in localStorage for dashboard to pick up
              localStorage.setItem('adminCreatedUser', JSON.stringify({
                userId: userData.userId,
                email: email,
                name: userData.name
              }));
              loginSuccess = true;
            } else {
              console.log("Password does not match");
              setMessage("Invalid email or password");
              return;
            }
          } else {
            console.log("No admin credentials found for this email");
            setMessage("Invalid email or password");
            return;
          }
        } catch (adminError) {
          console.error("Admin credential check failed:", adminError);
          setMessage("Login system error. Please try again.");
          return;
        }
      }
      
      if (loginSuccess) {
        setMessage("Login successful!");
        // Clear form
        setEmail("");
        setPassword("");
        // Redirect after brief delay
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setMessage(
        err.message.includes("wrong-password") ? "Wrong password" : 
        err.message.includes("user-not-found") ? "User not found" :
        err.message.includes("email-already-in-use") ? "Email already in use" :
        err.message.includes("weak-password") ? "Password should be at least 6 characters" :
        err.message.includes("invalid-email") ? "Invalid email address" :
        "Authentication failed: " + err.message
      );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/20 selection:text-white overflow-x-hidden relative">
      
      {/* --- ENHANCED BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-full blur-[150px] animate-pulse-slow" />
        
        {/* Secondary orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] animate-float" style={{animationDelay: '2s'}} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* --- ENHANCED NAVBAR --- */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center max-w-7xl mx-auto z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
            <BarChart3 size={18} className="text-black" />
          </div>
          <div className="font-bold text-xl tracking-tight">
            <span className="text-gray-400">FIC</span>{" "}
            <span className="text-white">HANSRAJ</span>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-emerald-500/30 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-emerald-400 font-medium">LIVE</span>
        </div>
      </nav>

      {/* --- ENHANCED HERO SECTION --- */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        
        {/* Enhanced Tag with glassmorphism */}
        <div 
          className={`
            flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md
            text-gray-300 text-sm font-medium mb-12 transition-all duration-1000 transform
            shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 hover:border-emerald-500/30
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
          `}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles size={12} className="text-black" />
            </div>
            <span>Live Trading Simulation</span>
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <span className="text-emerald-400 font-semibold">₹1,00,000 Capital</span>
        </div>

        {/* Enhanced Main Heading with better gradients */}
        <div className="space-y-4 mb-8">
          <h1 
            className={`
              text-6xl md:text-8xl lg:text-9xl font-black tracking-tight transition-all duration-1000 delay-100 transform
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            `}
          >
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-400">
              FIC HANSRAJ
            </span>
          </h1>
          <h2 
            className={`
              text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight transition-all duration-1000 delay-200 transform
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            `}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500">
              STOCK EXCHANGE
            </span>
          </h2>
        </div>

        {/* Enhanced Subtext */}
        <p 
          className={`
            text-gray-300 text-xl md:text-2xl max-w-4xl mx-auto mb-12 leading-relaxed transition-all duration-1000 delay-300 transform
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          `}
        >
          <span className="font-semibold text-white">Trade. Compete. Learn</span> — Experience real market dynamics in an intense 
          8-round simulation with live prices, strategic decisions, and ₹1,00,000 virtual capital.
        </p>

        {/* Enhanced Buttons with glassmorphism and animations */}
        <div 
          className={`
            flex flex-col sm:flex-row items-center gap-6 transition-all duration-1000 delay-500 transform
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          `}
        >
          {/* Primary Button - Enhanced with gradient and effects */}
          <button 
            onClick={() => setModalOpen(true)}
            className="group relative px-10 py-5 bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-bold rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 active:scale-95 w-full sm:w-auto min-w-[250px]"
          >
            <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
              <Zap size={20} />
              Enter Trading Arena
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>

          {/* Secondary Button - Enhanced glassmorphism */}
          <button className="group px-10 py-5 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 hover:border-white/20 hover:shadow-lg transition-all active:scale-95 w-full sm:w-auto min-w-[250px] backdrop-blur-md">
            <span className="flex items-center justify-center gap-3 text-lg">
              <Target size={20} className="text-gray-400 group-hover:text-emerald-400 transition-colors" />
              How It Works
              <ChevronRight size={20} className="text-gray-400 group-hover:text-white transition-colors group-hover:translate-x-1" />
            </span>
          </button>
        </div>

        {/* Enhanced Stats Footer with cards */}
        <div 
          className={`
            mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 transition-all duration-1000 delay-700 transform
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          `}
        >
          <div className="flex flex-col items-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105 group">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Timer size={24} className="text-black" />
            </div>
            <span className="text-5xl font-black text-white mb-2 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">8</span>
            <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Live Rounds</span>
          </div>
          
          <div className="flex flex-col items-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 size={24} className="text-black" />
            </div>
            <span className="text-5xl font-black text-white mb-2 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">15min</span>
            <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Per Round</span>
          </div>
          
          <div className="flex flex-col items-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105 group">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity size={24} className="text-black" />
            </div>
            <span className="text-5xl font-black text-white mb-2 flex items-center gap-3 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
              Live
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </span>
            <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Real-time Prices</span>
          </div>
        </div>
      </main>

      {/* --- ENHANCED FEATURES SECTION --- */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/50 to-black"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
              <Star size={16} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold text-sm">PREMIUM EXPERIENCE</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
              What Makes Us Different?
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed max-w-4xl mx-auto">
              A high-intensity, real-time stock market simulation that mirrors actual trading conditions with 
              <span className="text-emerald-400 font-semibold"> live market data</span> and 
              <span className="text-blue-400 font-semibold"> strategic challenges</span>.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl backdrop-blur-sm hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity size={28} className="text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Real-Time Data</h3>
              <p className="text-gray-400 leading-relaxed">
                Experience live market conditions with real stock prices updating every second, just like professional trading floors.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl backdrop-blur-sm hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} className="text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Competitive Trading</h3>
              <p className="text-gray-400 leading-relaxed">
                Compete against fellow students in intense 15-minute rounds with live leaderboards and performance analytics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl backdrop-blur-sm hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield size={28} className="text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Risk-Free Learning</h3>
              <p className="text-gray-400 leading-relaxed">
                Master trading strategies with ₹1,00,000 virtual capital in a safe environment designed for education.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- ENHANCED AUTH MODAL WITH GLASSMORPHISM --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-black/40 border border-white/20 rounded-3xl p-12 w-full max-w-lg relative shadow-2xl shadow-emerald-500/10 backdrop-blur-xl animate-scale-in">
            {/* Header with icon */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield size={28} className="text-black" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-3">
                Welcome Back
              </h2>
              <p className="text-gray-400">
                Sign in to access your trading dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:bg-white/10 rounded-2xl text-white placeholder-gray-400 outline-none transition-all backdrop-blur-sm focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:bg-white/10 rounded-2xl text-white placeholder-gray-400 outline-none transition-all backdrop-blur-sm focus:outline-none"
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold py-5 rounded-2xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 flex items-center justify-center gap-3 text-lg"
              >
                <Zap size={20} />
                Sign In
              </button>
            </form>

            {/* Contact Admin Note */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <p className="text-center text-blue-400 text-sm">
                <span className="font-medium">New User?</span> Contact admin to create your account
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className={`mt-6 p-4 rounded-2xl border text-center font-medium ${
                message.includes("wait") 
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {message}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}