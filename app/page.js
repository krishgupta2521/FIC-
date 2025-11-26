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
  MapPin,
  PlayCircle,
  Rocket
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
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500/20 selection:text-white overflow-x-hidden relative">
      {/* Dark overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-800/20 to-black/30 pointer-events-none z-[1]" />
      
      {/* --- LIGHT BACKGROUND WITH PULSING DOTS --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
        <div className="absolute inset-0 bg-gradient-to-tr from-gray-700/30 via-transparent to-gray-600/20" />
        
        {/* Pulsing colorful dots */}
        <div className="absolute inset-0">
          {/* Professional pulsing dots */}
          <div className="absolute top-[8%] left-[15%] w-2 h-2 bg-blue-400/30 rounded-full animate-pulse" style={{animationDuration: '2s'}} />
          <div className="absolute top-[12%] right-[25%] w-1.5 h-1.5 bg-slate-400/25 rounded-full animate-pulse" style={{animationDuration: '2.2s'}} />
          <div className="absolute top-[20%] left-[75%] w-2 h-2 bg-blue-500/30 rounded-full animate-pulse" style={{animationDuration: '2.1s'}} />
          <div className="absolute top-[25%] left-[45%] w-1.5 h-1.5 bg-emerald-500/25 rounded-full animate-pulse" style={{animationDuration: '2.3s'}} />
          <div className="absolute top-[35%] right-[15%] w-1.5 h-1.5 bg-slate-500/25 rounded-full animate-pulse" style={{animationDuration: '2s'}} />
          <div className="absolute top-[45%] left-[20%] w-1.5 h-1.5 bg-blue-400/25 rounded-full animate-pulse" style={{animationDuration: '2.4s'}} />
          <div className="absolute top-[55%] right-[35%] w-2 h-2 bg-slate-400/30 rounded-full animate-pulse" style={{animationDuration: '2.1s'}} />
          <div className="absolute top-[65%] left-[80%] w-1.5 h-1.5 bg-emerald-400/25 rounded-full animate-pulse" style={{animationDuration: '2.2s'}} />
          <div className="absolute top-[75%] left-[60%] w-1.5 h-1.5 bg-blue-500/25 rounded-full animate-pulse" style={{animationDuration: '2s'}} />
          <div className="absolute top-[85%] right-[45%] w-1.5 h-1.5 bg-slate-500/25 rounded-full animate-pulse" style={{animationDuration: '2.3s'}} />
          
          {/* Additional professional dots */}
          <div className="absolute top-[18%] left-[35%] w-1 h-1 bg-blue-400/20 rounded-full animate-pulse" style={{animationDuration: '2.4s'}} />
          <div className="absolute top-[28%] right-[60%] w-1 h-1 bg-slate-400/20 rounded-full animate-pulse" style={{animationDuration: '2.1s'}} />
          <div className="absolute top-[38%] left-[65%] w-1 h-1 bg-emerald-400/20 rounded-full animate-pulse" style={{animationDuration: '2.2s'}} />
          <div className="absolute top-[48%] right-[20%] w-1 h-1 bg-blue-500/20 rounded-full animate-pulse" style={{animationDuration: '2.3s'}} />
          <div className="absolute top-[58%] left-[40%] w-1 h-1 bg-slate-500/20 rounded-full animate-pulse" style={{animationDuration: '2s'}} />
          <div className="absolute top-[68%] right-[70%] w-1 h-1 bg-blue-400/20 rounded-full animate-pulse" style={{animationDuration: '2.4s'}} />
          <div className="absolute top-[78%] left-[25%] w-1 h-1 bg-emerald-500/20 rounded-full animate-pulse" style={{animationDuration: '2.1s'}} />
          <div className="absolute top-[88%] right-[55%] w-1 h-1 bg-slate-400/20 rounded-full animate-pulse" style={{animationDuration: '2.2s'}} />
          
          {/* More professional pulsing dots */}
          <div className="absolute top-[5%] left-[55%] w-1 h-1 bg-blue-300/15 rounded-full animate-pulse" style={{animationDuration: '2.3s'}} />
          <div className="absolute top-[15%] right-[80%] w-1 h-1 bg-slate-300/15 rounded-full animate-pulse" style={{animationDuration: '2s'}} />
          <div className="absolute top-[30%] left-[10%] w-1 h-1 bg-emerald-300/15 rounded-full animate-pulse" style={{animationDuration: '2.4s'}} />
          <div className="absolute top-[40%] right-[90%] w-1 h-1 bg-blue-400/15 rounded-full animate-pulse" style={{animationDuration: '2.1s'}} />
          <div className="absolute top-[50%] left-[85%] w-1 h-1 bg-slate-400/15 rounded-full animate-pulse" style={{animationDuration: '2.2s'}} />
          <div className="absolute top-[60%] right-[10%] w-1 h-1 bg-blue-500/15 rounded-full animate-pulse" style={{animationDuration: '2.3s'}} />
          <div className="absolute top-[70%] left-[5%] w-1 h-1 bg-slate-500/15 rounded-full animate-pulse" style={{animationDuration: '2s'}} />
          <div className="absolute top-[80%] right-[85%] w-1 h-1 bg-emerald-400/15 rounded-full animate-pulse" style={{animationDuration: '2.4s'}} />
          <div className="absolute top-[90%] left-[70%] w-1 h-1 bg-blue-400/15 rounded-full animate-pulse" style={{animationDuration: '2.1s'}} />
          <div className="absolute top-[95%] right-[30%] w-1 h-1 bg-slate-400/15 rounded-full animate-pulse" style={{animationDuration: '2.2s'}} />
        </div>
        
        {/* Dark ambient depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-700/20 to-gray-800/30" />


      </div>

      {/* --- ELEGANT NAVBAR --- */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center max-w-7xl mx-auto z-20">
        <div className="flex items-center">
          <div className="flex flex-col leading-none">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">THE FINANCE &</span>
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">INVESTMENT CELL,</span>
            <span className="text-sm font-bold text-white tracking-wide">HANSRAJ COLLEGE</span>
          </div>
        </div>
        
        {/* Professional status indicator */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/60 border border-slate-600/50 rounded-full backdrop-blur-lg">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-200 font-medium tracking-wide">LIVE</span>
        </div>
      </nav>

      {/* --- ENHANCED HERO SECTION --- */}
      <section className="relative z-10 flex flex-col items-center justify-center h-screen px-4 text-center">
        
        {/* Sophisticated Premium Tag */}
        <div className="flex items-center justify-center gap-4 px-8 py-4 rounded-2xl border border-blue-500/30 bg-slate-800/60 backdrop-blur-xl text-white text-sm font-medium mb-8 hover:border-blue-400/50 hover:bg-slate-800/70 transition-all duration-300">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="whitespace-nowrap font-semibold tracking-wide">
              Live Trading Simulation
            </span>
          </div>
          
          <div className="w-px h-5 bg-gradient-to-b from-transparent via-gray-400 to-transparent" />
          
          <div className="flex items-center gap-2">
            <span className="text-white font-bold whitespace-nowrap tracking-wide">
              ₹1,00,000
            </span>
            <span className="text-gray-300 font-medium text-xs uppercase tracking-widest">
              Capital
            </span>
          </div>
        </div>

        {/* Colorful Title Section */}
        <div className="text-center mb-16 relative">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-300">
            FIC HANSRAJ
          </h1>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-slate-200 to-blue-400 mb-8">
            STOCK EXCHANGE
          </h2>
          
          {/* Professional accent elements */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-blue-400/40" />
            <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full" />
            <div className="w-24 h-px bg-blue-400/30" />
            <div className="w-1 h-1 bg-slate-400/50 rounded-full" />
            <div className="w-24 h-px bg-blue-400/30" />
            <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-blue-400/40" />
          </div>
        </div>

        {/* Enhanced Subtext */}
        <p className="text-gray-300 text-xl md:text-2xl max-w-4xl mx-auto mb-16 leading-relaxed text-center">
          <span className="font-semibold text-blue-400">Trade. Compete. Learn</span> — Experience real market dynamics in an intense 
          8-round simulation with live prices, strategic decisions, and ₹1,00,000 virtual capital.
        </p>

        {/* Warm Inviting Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
          <button 
            onClick={() => setModalOpen(true)}
            className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-2xl backdrop-blur-xl border border-blue-500/40 hover:border-blue-400/60 transition-all duration-500 w-full sm:w-auto min-w-[280px] hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-600/20"
          >
            <span className="flex items-center justify-center gap-3 text-lg relative z-10">
              <Rocket size={20} className="group-hover:scale-110 transition-transform duration-300" />
              Enter Trading Arena
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            {/* Professional glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-400/0 group-hover:from-blue-500/15 group-hover:to-blue-400/10 rounded-2xl transition-all duration-500" />
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/10 rounded-2xl transition-all duration-700 transform group-hover:translate-x-full" />
          </button>

          <button 
            onClick={() => {
              const howItWorksSection = document.getElementById('how-it-works');
              if (howItWorksSection) {
                howItWorksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="group relative px-10 py-5 bg-gray-800/40 border border-gray-600/40 text-gray-200 font-semibold rounded-2xl backdrop-blur-xl hover:bg-gray-700/60 hover:border-gray-500/50 transition-all duration-500 w-full sm:w-auto min-w-[280px] hover:scale-[1.01] hover:shadow-lg hover:shadow-gray-700/30"
          >
            <span className="flex items-center justify-center gap-3 text-lg relative z-10">
              <Target size={20} className="text-gray-400 group-hover:text-gray-200 transition-colors duration-300" />
              How It Works
              <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-200 group-hover:translate-x-1 transition-all duration-300" />
            </span>
            {/* Dark glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600/0 to-gray-700/0 group-hover:from-gray-600/20 group-hover:to-gray-700/15 rounded-2xl transition-all duration-500" />
          </button>
        </div>


      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="py-32 relative bg-gradient-to-b from-slate-900/50 to-gray-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle depth layers */}
          <div className="absolute top-1/4 left-1/6 w-[400px] h-[200px] bg-gradient-to-r from-slate-800/8 via-slate-700/4 to-transparent rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/5 w-[300px] h-[300px] bg-gradient-to-l from-slate-700/6 via-slate-800/3 to-transparent rounded-full blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-500/10 border border-slate-400/20 rounded-full mb-8 backdrop-blur-sm">
              <Target size={16} className="text-slate-300" />
              <span className="text-slate-300 font-semibold text-sm uppercase tracking-wider">Game Mechanics</span>
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
                  <div className="relative bg-slate-800/40 border border-slate-600/50 rounded-2xl p-8 text-center backdrop-blur-xl hover:border-slate-500/60 hover:bg-slate-800/60 transition-all duration-300">
                    {/* Number circle */}
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                      1
                    </div>
                    
                    <h4 className="text-xl font-bold text-white mb-3">Round Starts</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Round starts with 15-minute timer
                    </p>
                  </div>
                  
                  {/* Enhanced Arrow */}
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 bg-gradient-to-r from-slate-400 to-gray-400 rounded-full flex items-center justify-center shadow-lg">
                      <ChevronRight size={16} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Step 2 - News Event */}
                <div className="relative group">
                  <div className="relative bg-slate-800/40 border border-slate-600/50 rounded-2xl p-8 text-center backdrop-blur-xl hover:border-slate-500/60 hover:bg-slate-800/60 transition-all duration-300">
                    {/* Number circle */}
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                      2
                    </div>
                    
                    <h4 className="text-xl font-bold text-white mb-3">News Event</h4>
                    <p className="text-slate-400 leading-relaxed">
                      News event drops, prices react instantly
                    </p>
                  </div>
                  
                  {/* Enhanced Arrow */}
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 bg-gradient-to-r from-slate-400 to-gray-400 rounded-full flex items-center justify-center shadow-lg">
                      <ChevronRight size={16} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Step 3 - Trade Decision */}
                <div className="relative group">
                  <div className="relative bg-slate-800/40 border border-slate-600/50 rounded-2xl p-8 text-center backdrop-blur-xl hover:border-slate-500/60 hover:bg-slate-800/60 transition-all duration-300">
                    {/* Number circle */}
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                      3
                    </div>
                    
                    <h4 className="text-xl font-bold text-white mb-3">Trade Decision</h4>
                    <p className="text-slate-400 leading-relaxed">
                      You buy/sell stocks based on analysis
                    </p>
                  </div>
                  
                  {/* Enhanced Arrow */}
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-6 bg-gradient-to-r from-slate-400 to-gray-400 rounded-full flex items-center justify-center shadow-lg">
                      <ChevronRight size={16} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Step 4 - Round Ends */}
                <div className="relative">
                  <div className="relative bg-slate-800/40 border border-slate-600/50 rounded-2xl p-8 text-center backdrop-blur-xl hover:border-slate-500/60 hover:bg-slate-800/60 transition-all duration-300">
                    {/* Number circle */}
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                      4
                    </div>
                    
                    <h4 className="text-xl font-bold text-white mb-3">Round Ends</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Round ends, rankings update, repeat
                    </p>
                  </div>
                </div>

              </div>
              
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-slate-600/20 transform -translate-y-1/2 -z-10" />
            </div>
          </div>

          {/* Game Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Real-Time Prices */}
            <div className="bg-slate-800/30 border border-slate-600/40 rounded-2xl p-6 backdrop-blur-xl hover:border-slate-500/50 hover:bg-slate-700/40 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center mb-4">
                <Activity size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Live Market Data</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Real stock prices that update every second, giving you authentic market experience with live BSE/NSE data.
              </p>
            </div>

            {/* News Events */}
            <div className="bg-slate-800/30 border border-slate-600/40 rounded-2xl p-6 backdrop-blur-xl hover:border-slate-500/50 hover:bg-slate-700/40 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                <Zap size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Dynamic News Events</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Strategic news releases each round that impact stock prices, testing your ability to react and adapt quickly.
              </p>
            </div>

            {/* Competition */}
            <div className="bg-slate-800/30 border border-slate-600/40 rounded-2xl p-6 backdrop-blur-xl hover:border-slate-500/50 hover:bg-slate-700/40 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center mb-4">
                <Users size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Competitive Rankings</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
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
            <div className="flex flex-col items-center p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-xl hover:bg-white/15 transition-all hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Timer size={24} className="text-white" />
              </div>
              <span className="text-5xl font-black text-white mb-2 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">8</span>
              <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Live Rounds</span>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-xl hover:bg-white/15 transition-all hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 size={24} className="text-white" />
              </div>
              <span className="text-5xl font-black text-white mb-2 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">15min</span>
              <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Per Round</span>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-xl hover:bg-white/15 transition-all hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity size={24} className="text-white" />
              </div>
              <span className="text-5xl font-black text-white mb-2 flex items-center gap-3 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
                Live
                <span className="flex h-3 w-3 relative">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400/30"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                </span>
              </span>
              <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Real-time Prices</span>
            </div>
          </div>

          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/15 border border-violet-500/30 rounded-full mb-6 backdrop-blur-sm">
              <Star size={16} className="text-violet-400" />
              <span className="text-violet-400 font-semibold text-sm">PREMIUM EXPERIENCE</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
              What Makes Us Different?
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed max-w-4xl mx-auto">
              A high-intensity, real-time stock market simulation that mirrors actual trading conditions with 
              <span className="text-violet-400 font-semibold"> live market data</span> and 
              <span className="text-cyan-400 font-semibold"> strategic challenges</span>.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-gradient-to-br from-white/15 to-white/5 border border-white/25 rounded-3xl backdrop-blur-2xl hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-500 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-violet-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Real-Time Data</h3>
              <p className="text-gray-400 leading-relaxed">
                Experience live market conditions with real stock prices updating every second, just like professional trading floors.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-gradient-to-br from-white/15 to-white/5 border border-white/25 rounded-3xl backdrop-blur-2xl hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Competitive Trading</h3>
              <p className="text-gray-400 leading-relaxed">
                Compete against fellow students in intense 15-minute rounds with live leaderboards and performance analytics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-gradient-to-br from-white/15 to-white/5 border border-white/25 rounded-3xl backdrop-blur-2xl hover:border-rose-500/40 hover:shadow-2xl hover:shadow-rose-500/20 transition-all duration-500 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield size={28} className="text-white" />
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
          {/* Professional modal background */}
          <div className="relative w-full max-w-lg">
            {/* Professional blue glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 via-slate-600/10 to-blue-600/15 rounded-3xl blur-2xl" />
            
            {/* Main modal container with professional glassmorphism */}
            <div className="relative bg-slate-800/60 border border-slate-600/30 rounded-3xl p-12 shadow-2xl shadow-blue-600/20 backdrop-blur-3xl animate-scale-in overflow-hidden">
              {/* Professional background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 via-transparent to-blue-600/5 rounded-3xl" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/8 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-600/8 rounded-full blur-2xl" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Professional header design */}
                <div className="text-center mb-10">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl blur-md opacity-40" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto">
                      <Shield size={28} className="text-white" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-3">
                    Welcome Back
                  </h2>
                  <p className="text-slate-300 text-lg">
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
                      className="w-full px-6 py-4 bg-slate-700/30 border border-slate-600/40 focus:border-blue-500/60 focus:bg-slate-700/50 rounded-2xl text-white placeholder-slate-400 outline-none transition-all backdrop-blur-xl hover:border-slate-500/50 focus:shadow-lg focus:shadow-blue-600/20"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-6 py-4 bg-slate-700/30 border border-slate-600/40 focus:border-blue-500/60 focus:bg-slate-700/50 rounded-2xl text-white placeholder-slate-400 outline-none transition-all backdrop-blur-xl hover:border-slate-500/50 focus:shadow-lg focus:shadow-blue-600/20"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-5 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-600/30 flex items-center justify-center gap-3 text-lg relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                    <Rocket size={20} className="relative z-10" />
                    <span className="relative z-10">Sign In</span>
                  </button>
                </form>

                {/* Contact Admin Note */}
                <div className="mt-8 p-5 bg-gradient-to-r from-blue-600/10 to-slate-600/10 border border-blue-500/25 rounded-2xl backdrop-blur-xl">
                  <p className="text-center text-blue-300 text-sm">
                    <span className="font-medium">New User?</span> Contact admin to create your account
                  </p>
                </div>

                {/* Message */}
                {message && (
                  <div className={`mt-6 p-4 rounded-2xl border text-center font-medium backdrop-blur-xl ${
                    message.includes("wait") 
                      ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                      : message.includes("successful") || message.includes("Login successful")
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/15 border-red-500/30 text-red-300"
                  }`}>
                    {message}
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={() => setModalOpen(false)}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-700/30 hover:bg-slate-600/50 border border-slate-600/30 rounded-full text-slate-400 hover:text-white transition-all hover:rotate-90 hover:scale-110"
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
                  className="w-10 h-10 bg-white/10 hover:bg-violet-500/25 border border-white/20 hover:border-violet-500/40 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-400 transition-all hover:scale-110 backdrop-blur-sm"
                  aria-label="Visit our Facebook page"
                >
                  <Facebook size={18} />
                </a>
                <a 
                  href="https://www.linkedin.com/company/the-finance-investment-cell-hansraj-college/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-cyan-500/25 border border-white/20 hover:border-cyan-500/40 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all hover:scale-110 backdrop-blur-sm"
                  aria-label="Visit our LinkedIn page"
                >
                  <Linkedin size={18} />
                </a>
                <a 
                  href="https://www.instagram.com/fichansraj?igsh=Ym9teTF5MnRwYjM=" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-rose-500/25 border border-white/20 hover:border-rose-500/40 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all hover:scale-110 backdrop-blur-sm"
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
                <a href="#" className="block text-gray-400 hover:text-violet-400 transition-colors hover:translate-x-1 transform duration-200">
                  How It Works
                </a>
                <a href="#" className="block text-gray-400 hover:text-violet-400 transition-colors hover:translate-x-1 transform duration-200">
                  Rules & Guidelines  
                </a>
                <a href="#" className="block text-gray-400 hover:text-violet-400 transition-colors hover:translate-x-1 transform duration-200">
                  FAQ
                </a>
                <a href="#" className="block text-gray-400 hover:text-violet-400 transition-colors hover:translate-x-1 transform duration-200">
                  Terms & Conditions
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Contact Us</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 bg-violet-500/15 rounded-lg flex items-center justify-center">
                    <Mail size={16} className="text-violet-400" />
                  </div>
                  <span>fic.core2025@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 bg-cyan-500/15 rounded-lg flex items-center justify-center">
                    <Phone size={16} className="text-cyan-400" />
                  </div>
                  <span>+91 80767 26998</span>
                </div>
                <div className="flex items-start gap-3 text-gray-400">
                  <div className="w-8 h-8 bg-rose-500/15 rounded-lg flex items-center justify-center mt-1">
                    <MapPin size={16} className="text-rose-400" />
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
              <a href="#" className="text-gray-500 hover:text-violet-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-violet-400 transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}