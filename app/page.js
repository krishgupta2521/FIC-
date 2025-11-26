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
  X,
  Facebook,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin
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
          const encodedEmail = email.replace(/\./g, '_DOT_').replace(/\#/g, '_HASH_').replace(/\$/g, '_DOLLAR_').replace(/\[/g, '_LBRACKET_').replace(/\]/g, '_RBRACKET_');
          const credentialsRef = ref(db, `userCredentials/${encodedEmail}`);
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
      {/* Modern overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20 pointer-events-none z-[1]" />
      
      {/* --- PREMIUM AESTHETIC BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Enhanced base gradient with depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black" />
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 via-transparent to-blue-950/20" />
        
        {/* Premium animated gradient orbs */}
        <div className="absolute top-1/4 left-1/8 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/12 via-teal-400/8 to-cyan-400/6 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/8 w-[700px] h-[700px] bg-gradient-to-l from-blue-500/12 via-indigo-400/8 to-violet-400/6 rounded-full blur-[140px] animate-float" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-gradient-to-t from-purple-500/10 via-fuchsia-400/6 to-pink-400/4 rounded-full blur-[130px] animate-float" style={{animationDelay: '4s'}} />
        <div className="absolute top-3/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-teal-500/8 via-emerald-400/6 to-green-400/4 rounded-full blur-[120px] animate-float" style={{animationDelay: '6s'}} />
        
        {/* Sophisticated grid systems */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,.04)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_100%_70%_at_50%_50%,#000_30%,transparent_90%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_120%_80%_at_30%_20%,#000_20%,transparent_70%)]" />
        
        {/* Dynamic diagonal patterns */}
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(135deg,transparent_48%,rgba(34,197,94,.025)_49%,rgba(34,197,94,.025)_51%,transparent_52%)] bg-[size:80px_80px]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(-135deg,transparent_48%,rgba(59,130,246,.02)_49%,rgba(59,130,246,.02)_51%,transparent_52%)] bg-[size:120px_120px]" />
        
        {/* Hexagonal pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L52 15V45L30 60L8 45V15L30 0Z' fill='none' stroke='rgba(34,197,94,1)' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        
        {/* Enhanced noise and grain */}
        <div className="absolute inset-0 opacity-[0.025] mix-blend-soft-light" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E")'}} />
        
        {/* Animated floating elements */}
        <div className="absolute top-1/5 left-1/6 w-2 h-2 bg-emerald-400/40 rounded-full animate-ping" style={{animationDelay: '1s'}} />
        <div className="absolute top-2/5 right-1/5 w-1.5 h-1.5 bg-blue-400/35 rounded-full animate-ping" style={{animationDelay: '3s'}} />
        <div className="absolute bottom-1/5 left-2/5 w-1 h-1 bg-purple-400/45 rounded-full animate-ping" style={{animationDelay: '5s'}} />
        <div className="absolute top-3/5 left-4/5 w-0.5 h-0.5 bg-teal-400/50 rounded-full animate-ping" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-2/5 right-1/3 w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-ping" style={{animationDelay: '4s'}} />
        <div className="absolute top-1/8 right-3/8 w-1 h-1 bg-indigo-400/35 rounded-full animate-ping" style={{animationDelay: '6s'}} />
        
        {/* Subtle geometric shapes */}
        <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-emerald-500/5 rotate-45 rounded-lg animate-float" style={{animationDelay: '8s'}} />
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 border border-blue-500/5 rotate-12 rounded-full animate-float" style={{animationDelay: '10s'}} />
        
        {/* Radial gradient overlays for depth */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-transparent via-emerald-950/5 to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-radial from-transparent via-blue-950/5 to-transparent" />
      </div>

      {/* --- ENHANCED NAVBAR --- */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center max-w-7xl mx-auto z-20">
        <div className="flex items-center">
          <div className="flex flex-col leading-none">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">THE FINANCE &</span>
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">INVESTMENT CELL,</span>
            <span className="text-sm font-bold text-white tracking-wide">HANSRAJ COLLEGE</span>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-emerald-500/30 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-emerald-400 font-medium">LIVE</span>
        </div>
      </nav>

      {/* --- ENHANCED HERO SECTION --- */}
      <section className="relative z-10 flex flex-col items-center justify-center h-screen px-4 text-center">
        
        {/* Premium Aesthetic Tag */}
        <div 
          className={`
            relative group flex items-center justify-center gap-4 px-8 py-3 rounded-full 
            border border-white/20 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl
            text-gray-200 text-sm font-medium mb-12 transition-all duration-1000 transform
            shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:border-emerald-400/40
            hover:scale-105 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:via-blue-500/5 hover:to-purple-500/10
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
          `}
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-purple-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Main content */}
          <div className="relative flex items-center justify-center gap-3">
            <div className="relative">
              {/* Icon glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-6 h-6 bg-gradient-to-br from-emerald-400 via-teal-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp size={14} className="text-black group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span className="whitespace-nowrap font-semibold tracking-wide text-white group-hover:text-emerald-100 transition-colors">
              Live Trading Simulation
            </span>
          </div>
          
          {/* Animated divider */}
          <div className="relative">
            <div className="w-px h-5 bg-gradient-to-b from-transparent via-white/30 to-transparent flex-shrink-0" />
            <div className="absolute inset-0 w-px bg-gradient-to-b from-emerald-400/50 via-blue-400/50 to-purple-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          
          <div className="relative flex items-center gap-2">
            <span className="text-emerald-400 font-bold whitespace-nowrap tracking-wide group-hover:text-emerald-300 transition-colors">
              ₹1,00,000
            </span>
            <span className="text-gray-400 font-medium text-xs uppercase tracking-widest group-hover:text-gray-300 transition-colors">
              Capital
            </span>
          </div>
          
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 rounded-full" />
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
          <button 
            onClick={() => {
              const howItWorksSection = document.getElementById('how-it-works');
              if (howItWorksSection) {
                howItWorksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="group px-10 py-5 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 hover:border-white/20 hover:shadow-lg transition-all active:scale-95 w-full sm:w-auto min-w-[250px] backdrop-blur-md"
          >
            <span className="flex items-center justify-center gap-3 text-lg">
              <Target size={20} className="text-gray-400 group-hover:text-emerald-400 transition-colors" />
              How It Works
              <ChevronRight size={20} className="text-gray-400 group-hover:text-white transition-colors group-hover:translate-x-1" />
            </span>
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center text-gray-400 hover:text-white transition-colors cursor-pointer">
            <span className="text-sm mb-2 font-medium">Scroll to explore</span>
            <ChevronRight size={20} className="rotate-90" />
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="py-32 relative bg-gradient-to-b from-gray-950/50 to-black">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Background effects for this section */}
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-gradient-to-r from-emerald-500/5 via-teal-500/3 to-transparent rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-gradient-to-l from-blue-500/5 via-indigo-500/3 to-transparent rounded-full blur-[80px] animate-float" style={{animationDelay: '2s'}} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
              <Target size={16} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">Game Mechanics</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
              How the Game Works
            </h2>
            <p className="text-2xl text-gray-300 font-medium mb-4">
              8 Rounds. 8 News Events. Live Price Movement.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed max-w-4xl mx-auto">
              Experience realistic market conditions with real-time price updates, strategic news events, 
              and competitive trading in a fast-paced simulation environment.
            </p>
          </div>

          {/* Enhanced Trading Loop */}
          <div className="mb-20">
            <h3 className="text-4xl font-black text-white text-center mb-16 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              The Trading Loop
            </h3>
            <div className="relative max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
                
                {/* Step 1 - Round Starts */}
                <div className="relative group">
                  <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 border border-gray-700/50 rounded-3xl p-8 text-center backdrop-blur-xl hover:border-emerald-400/40 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    {/* Number circle with enhanced design */}
                    <div className="relative">
                      <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity mx-auto" />
                      <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-black font-black text-2xl shadow-2xl group-hover:scale-110 transition-transform duration-500">
                        1
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-100 transition-colors">Round Starts</h4>
                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                      Round starts with 15-minute timer
                    </p>
                  </div>
                  
                  {/* Enhanced Arrow */}
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center shadow-lg">
                      <ChevronRight size={16} className="text-black" />
                    </div>
                  </div>
                </div>

                {/* Step 2 - News Event */}
                <div className="relative group">
                  <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 border border-gray-700/50 rounded-3xl p-8 text-center backdrop-blur-xl hover:border-blue-400/40 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    {/* Number circle with enhanced design */}
                    <div className="relative">
                      <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity mx-auto" />
                      <div className="relative w-20 h-20 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-black font-black text-2xl shadow-2xl group-hover:scale-110 transition-transform duration-500">
                        2
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-100 transition-colors">News Event</h4>
                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                      News event drops, prices react instantly
                    </p>
                  </div>
                  
                  {/* Enhanced Arrow */}
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center shadow-lg">
                      <ChevronRight size={16} className="text-black" />
                    </div>
                  </div>
                </div>

                {/* Step 3 - Trade Decision */}
                <div className="relative group">
                  <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 border border-gray-700/50 rounded-3xl p-8 text-center backdrop-blur-xl hover:border-purple-400/40 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    {/* Number circle with enhanced design */}
                    <div className="relative">
                      <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity mx-auto" />
                      <div className="relative w-20 h-20 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-black font-black text-2xl shadow-2xl group-hover:scale-110 transition-transform duration-500">
                        3
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-100 transition-colors">Trade Decision</h4>
                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                      You buy/sell stocks based on analysis
                    </p>
                  </div>
                  
                  {/* Enhanced Arrow */}
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-violet-400 rounded-full flex items-center justify-center shadow-lg">
                      <ChevronRight size={16} className="text-black" />
                    </div>
                  </div>
                </div>

                {/* Step 4 - Round Ends */}
                <div className="relative group">
                  <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 border border-gray-700/50 rounded-3xl p-8 text-center backdrop-blur-xl hover:border-orange-400/40 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20 overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    {/* Number circle with enhanced design */}
                    <div className="relative">
                      <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity mx-auto" />
                      <div className="relative w-20 h-20 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-black font-black text-2xl shadow-2xl group-hover:scale-110 transition-transform duration-500">
                        4
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-100 transition-colors">Round Ends</h4>
                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                      Round ends, rankings update, repeat
                    </p>
                  </div>
                </div>

              </div>
              
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-600/30 to-transparent transform -translate-y-1/2 -z-10" />
            </div>
          </div>

          {/* Game Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Real-Time Prices */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 backdrop-blur-sm hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <Activity size={24} className="text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Live Market Data</h3>
              <p className="text-gray-400 leading-relaxed">
                Real stock prices that update every second, giving you authentic market experience with live BSE/NSE data.
              </p>
            </div>

            {/* News Events */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 backdrop-blur-sm hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap size={24} className="text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Dynamic News Events</h3>
              <p className="text-gray-400 leading-relaxed">
                Strategic news releases each round that impact stock prices, testing your ability to react and adapt quickly.
              </p>
            </div>

            {/* Competition */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 backdrop-blur-sm hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Users size={24} className="text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Competitive Rankings</h3>
              <p className="text-gray-400 leading-relaxed">
                Live leaderboards track your performance against other players, with rankings updated after each round.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --- ENHANCED FEATURES SECTION --- */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/50 to-black"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-20">
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

      {/* --- MODERN GLASSMORPHISM AUTH MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
          {/* Modern modal background with enhanced glassmorphism */}
          <div className="relative w-full max-w-lg">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
            
            {/* Main modal container */}
            <div className="relative bg-black/60 border border-white/10 rounded-3xl p-12 shadow-2xl shadow-emerald-500/20 backdrop-blur-2xl animate-scale-in overflow-hidden">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-emerald-500/[0.02] rounded-3xl" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header with enhanced design */}
                <div className="text-center mb-10">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl blur-md opacity-50" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                      <Shield size={28} className="text-black" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-3">
                    Welcome Back
                  </h2>
                  <p className="text-gray-400/90 text-lg">
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
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:bg-white/10 rounded-2xl text-white placeholder-gray-400 outline-none transition-all backdrop-blur-sm hover:border-white/20 focus:shadow-lg focus:shadow-emerald-500/10"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:bg-white/10 rounded-2xl text-white placeholder-gray-400 outline-none transition-all backdrop-blur-sm hover:border-white/20 focus:shadow-lg focus:shadow-emerald-500/10"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold py-5 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/30 flex items-center justify-center gap-3 text-lg relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                    <Zap size={20} className="relative z-10" />
                    <span className="relative z-10">Sign In</span>
                  </button>
                </form>

                {/* Contact Admin Note */}
                <div className="mt-8 p-5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-sm">
                  <p className="text-center text-blue-400 text-sm">
                    <span className="font-medium">New User?</span> Contact admin to create your account
                  </p>
                </div>

                {/* Message */}
                {message && (
                  <div className={`mt-6 p-4 rounded-2xl border text-center font-medium backdrop-blur-sm ${
                    message.includes("wait") 
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : message.includes("successful") || message.includes("Login successful")
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}>
                    {message}
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={() => setModalOpen(false)}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all hover:rotate-90 hover:scale-110"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PROFESSIONAL FOOTER --- */}
      <footer className="relative z-10 bg-black/80 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Organization Info */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">FIC Hansraj Stock Exchange</h3>
              <p className="text-gray-400 leading-relaxed max-w-md">
                A realistic trading simulation platform designed for students to learn market dynamics, test strategies, and compete in a risk-free environment.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center gap-4">
                <a 
                  href="https://www.facebook.com/share/1AHaboK5uF/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-400 transition-all hover:scale-110"
                  aria-label="Visit our Facebook page"
                >
                  <Facebook size={18} />
                </a>
                <a 
                  href="https://www.linkedin.com/company/the-finance-investment-cell-hansraj-college/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-400 transition-all hover:scale-110"
                  aria-label="Visit our LinkedIn page"
                >
                  <Linkedin size={18} />
                </a>
                <a 
                  href="https://www.instagram.com/fichansraj?igsh=Ym9teTF5MnRwYjM=" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-400 transition-all hover:scale-110"
                  aria-label="Visit our Instagram page"
                >
                  <Instagram size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Quick Links</h3>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                  How It Works
                </a>
                <a href="#" className="block text-gray-400 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                  Rules & Guidelines  
                </a>
                <a href="#" className="block text-gray-400 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                  FAQ
                </a>
                <a href="#" className="block text-gray-400 hover:text-emerald-400 transition-colors hover:translate-x-1 transform duration-200">
                  Terms & Conditions
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Contact Us</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Mail size={16} className="text-emerald-400" />
                  </div>
                  <span>fic.core2025@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Phone size={16} className="text-blue-400" />
                  </div>
                  <span>+91 80767 26998</span>
                </div>
                <div className="flex items-start gap-3 text-gray-400">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mt-1">
                    <MapPin size={16} className="text-purple-400" />
                  </div>
                  <span className="leading-relaxed">
                    Hansraj College, University<br />
                    of Delhi, Delhi 110007
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 Finance & Investment Cell, Hansraj College. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-emerald-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-emerald-400 transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}