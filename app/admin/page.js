"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
// We use 'remove' from Realtime Database instead of 'deleteDoc' from Firestore
import { ref, push, set, remove, onValue, update, get } from "firebase/database";
import { generateCompanyData, validateCompanyData } from "../utils/companyUtils";

// Helper functions to encode/decode emails for Firebase paths
const encodeEmail = (email) => {
  return email.replace(/\./g, '_DOT_').replace(/\#/g, '_HASH_').replace(/\$/g, '_DOLLAR_').replace(/\[/g, '_LBRACKET_').replace(/\]/g, '_RBRACKET_');
};

const decodeEmail = (encodedEmail) => {
  return encodedEmail.replace(/_DOT_/g, '.').replace(/_HASH_/g, '#').replace(/_DOLLAR_/g, '$').replace(/_LBRACKET_/g, '[').replace(/_RBRACKET_/g, ']');
};

export default function Admin() {
  // --- AUTH & EXISTING STATE ---
  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [message, setMessage] = useState("");

  // --- NEWS & GAME STATE ---
  const [news, setNews] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [selectedStocks, setSelectedStocks] = useState({});
  const [impactPercent, setImpactPercent] = useState(10);
  const [stocks, setStocks] = useState({});
  const [pendingNews, setPendingNews] = useState({});
  const [isFrozen, setIsFrozen] = useState(false);

  // --- PARTICIPANTS & FLUCTUATION STATE ---
  const [participants, setParticipants] = useState([]);
  const [isFluctuating, setIsFluctuating] = useState(false);

  // --- TIMER & HISTORY STATE (NEW) ---
  const [timerData, setTimerData] = useState(null);
  const [tick, setTick] = useState(0);
  const [roundHistory, setRoundHistory] = useState({});

  // --- PENDING PRICE CHANGES STATE ---
  const [pendingPrices, setPendingPrices] = useState({});

  // --- NEW STOCK STATE ---
  const [newStockSymbol, setNewStockSymbol] = useState("");
  const [newStockPrice, setNewStockPrice] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [showAddStock, setShowAddStock] = useState(false);
  const [logoDetectionResult, setLogoDetectionResult] = useState(null);
  const [isDetectingLogo, setIsDetectingLogo] = useState(false);

  // --- PERSISTENT LOGIN STATE ---
  const [keepSignedIn, setKeepSignedIn] = useState(false); 

  // --- USER MANAGEMENT STATE ---
  const [showAddUser, setShowAddUser] = useState(false);

  // --- MARKET DYNAMICS STATE ---
  const [marketData, setMarketData] = useState({});
  const [orderBook, setOrderBook] = useState({});
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserCash, setNewUserCash] = useState("100000");



  const ADMIN_PASS = "PunkRocker@Alok0045";

  // 0. Check for saved login on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuth');
    if (savedAuth === 'true') {
      setIsAuth(true);
      setMessage("Welcome back, admin!");
    }
  }, []);

  // 1. Message Auto-Clear
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // 2. Timer Ticker
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. AUTO-FLUCTUATION LOGIC (CHAOS MODE)
  useEffect(() => {
    let interval;
    if (isFluctuating && !isFrozen) {
      interval = setInterval(() => {
        const updates = {};
        Object.entries(stocks).forEach(([sym, data]) => {
          const currentPrice = Number(data.price);
          // Fluctuate between -2% and +2%
          const change = (Math.random() - 0.5) * 0.04; 
          const newPrice = Math.max(10, currentPrice * (1 + change));
          updates[`stocks/${sym}/price`] = Number(newPrice.toFixed(2));
        });
        update(ref(db), updates);
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [isFluctuating, isFrozen, stocks]);

  // 4. Realtime Listeners
  useEffect(() => {
    if (!isAuth) return;

    // Stocks
    onValue(ref(db, "stocks"), (s) => setStocks(s.val() || {}));
    
    // Pending News
    onValue(ref(db, "pendingNews"), (s) => setPendingNews(s.val() || {}));
    
    // Game Status
    onValue(ref(db, "game/frozen"), (s) => setIsFrozen(s.val() === true));

    // Timer
    onValue(ref(db, "roundTimer/current"), (snapshot) => {
      if (snapshot.exists()) {
        setTimerData(snapshot.val());
      } else {
        const initialData = { isRunning: false, isPaused: false, startTime: 0, pauseDuration: 0, endTime: null, roundNumber: 1, durationMinutes: 15 };
        set(ref(db, "roundTimer/current"), initialData);
        setTimerData(initialData);
      }
    });

    // Round History Listener
    onValue(ref(db, "roundHistory"), (snapshot) => {
      setRoundHistory(snapshot.val() || {});
    });

    // Participants Listener
    onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setParticipants([]);
        return;
      }
      const list = Object.entries(data).map(([uid, userData]) => {
        const cash = Number(userData.cash || 0);
        return { uid, ...userData, cash };
      });
      setParticipants(list);
    });

    // Market Data Listener
    onValue(ref(db, "marketData"), (snapshot) => {
      setMarketData(snapshot.val() || {});
    });

    // Order Book Listener  
    onValue(ref(db, "orderBook"), (snapshot) => {
      setOrderBook(snapshot.val() || {});
    });



  }, [isAuth]);

  // --- ACTIONS ---
  const login = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      setIsAuth(true);
      if (keepSignedIn) {
        localStorage.setItem('adminAuth', 'true');
        setMessage("Signed in successfully (staying signed in)");
      } else {
        localStorage.removeItem('adminAuth');
        setMessage("Signed in successfully");
      }
      setPassword("");
    } else {
      setMessage("Invalid password");
    }
  };

  const logout = () => {
    setIsAuth(false);
    localStorage.removeItem('adminAuth');
    setPassword("");
    setMessage("Signed out successfully");
  };

  const updatePendingPrice = (symbol, newPrice) => {
    setPendingPrices(prev => ({
      ...prev,
      [symbol]: Number(newPrice)
    }));
  };

  const triggerPriceChange = async (symbol) => {
    const newPrice = pendingPrices[symbol];
    if (newPrice === undefined) return;
    
    try {
      await update(ref(db, `stocks/${symbol}`), { price: newPrice });
      setPendingPrices(prev => {
        const updated = { ...prev };
        delete updated[symbol];
        return updated;
      });
      setMessage(`${symbol} price updated to ₹${newPrice}`);
    } catch (err) {
      setMessage("Update Failed");
    }
  };

  const cancelPriceChange = (symbol) => {
    setPendingPrices(prev => {
      const updated = { ...prev };
      delete updated[symbol];
      return updated;
    });
  };

  const detectCompanyLogo = async () => {
    if (!newStockSymbol.trim()) {
      setMessage("Please enter a stock symbol first");
      return;
    }

    setIsDetectingLogo(true);
    setLogoDetectionResult(null);

    try {
      const companyData = await generateCompanyData(
        newStockSymbol.trim().toUpperCase(), 
        newCompanyName.trim() || null
      );
      
      setLogoDetectionResult(companyData);
      
      // Auto-fill company name if not provided
      if (!newCompanyName.trim() && companyData.name !== companyData.symbol) {
        setNewCompanyName(companyData.name);
      }
      
      setMessage(companyData.logoUrl ? 
        `✅ Logo found for ${companyData.name}` : 
        `⚠️ No logo found, will use fallback design`
      );
    } catch (err) {
      setMessage("Failed to detect company info");
    } finally {
      setIsDetectingLogo(false);
    }
  };

  const addNewStock = async () => {
    if (!newStockSymbol.trim() || !newStockPrice) {
      setMessage("Please enter both symbol and price");
      return;
    }

    const symbol = newStockSymbol.trim().toUpperCase();
    const price = Number(newStockPrice);
    const companyName = newCompanyName.trim() || symbol;

    // Validate input
    const validation = validateCompanyData({ symbol, name: companyName });
    if (!validation.isValid) {
      setMessage(validation.errors.join(", "));
      return;
    }

    if (stocks[symbol]) {
      setMessage("Stock symbol already exists");
      return;
    }

    if (price <= 0) {
      setMessage("Price must be greater than 0");
      return;
    }

    try {
      // Create enhanced stock data
      const stockData = {
        price: price,
        symbol: symbol,
        name: companyName,
        createdAt: Date.now()
      };

      // Add logo info if detected
      if (logoDetectionResult) {
        stockData.domain = logoDetectionResult.domain;
        stockData.sector = logoDetectionResult.sector;
        stockData.color = logoDetectionResult.color;
      }

      await set(ref(db, `stocks/${symbol}`), stockData);
      
      // Reset form
      setNewStockSymbol("");
      setNewStockPrice("");
      setNewCompanyName("");
      setLogoDetectionResult(null);
      setShowAddStock(false);
      
      setMessage(`Stock ${symbol} (${companyName}) added successfully${
        logoDetectionResult?.logoUrl ? ' with logo' : ''
      }`);
    } catch (err) {
      setMessage("Failed to add stock");
    }
  };

  const deleteStock = async (symbol) => {
    if (!confirm(`Delete stock ${symbol} permanently? This will affect all user portfolios.`)) return;
    
    try {
      await remove(ref(db, `stocks/${symbol}`));
      setMessage(`Stock ${symbol} deleted`);
    } catch (err) {
      setMessage("Failed to delete stock");
    }
  };

  const resetAllPortfolios = async () => {
    if (!confirm("WARNING: RESET ALL USERS TO ₹1,00,000? THIS CANNOT BE UNDONE.")) return;
    const updates = {};
    participants.forEach((p) => {
      updates[`users/${p.uid}/cash`] = 100000;
      updates[`users/${p.uid}/holdings`] = {};
      updates[`tradeHistory/${p.uid}`] = null; 
      updates[`roundPnL/${p.uid}`] = null; 
    });
    try {
      await update(ref(db), updates);
      setMessage("ALL PORTFOLIOS RESET");
    } catch (e) {
      setMessage("RESET FAILED: " + e.message);
    }
  };

  // --- PUBLISH, LOCK & DELETE ROUND LOGIC ---
  const publishAndLockRound = async () => {
    const rNum = timerData?.roundNumber || 1;
    if (!confirm(`Lock prices for Round ${rNum} to History?`)) return;

    try {
      const snapshot = {};
      Object.keys(stocks).forEach(sym => {
        snapshot[sym] = stocks[sym].price;
      });

      await set(ref(db, `roundHistory/round${rNum}`), {
        prices: snapshot,
        timestamp: Date.now(),
        roundNumber: rNum
      });
      setMessage(`ROUND ${rNum} LOCKED TO HISTORY`);
    } catch (e) {
      setMessage("LOCK FAILED: " + e.message);
    }
  };

  // NEW: Delete Round Function using Realtime Database
  const deleteRound = async (roundKey) => {
    if (!confirm(`Delete ${roundKey.replace("round", "Round ")} permanently?`)) return;
    try {
      await remove(ref(db, `roundHistory/${roundKey}`));
      setMessage(`${roundKey.replace("round", "Round ")} DELETED!`);
    } catch (err) {
      setMessage("Error deleting round");
    }
  };

  // --- TIMER LOGIC ---
  const startTimerRound = async () => {
    if (timerData?.isRunning) return;
    await update(ref(db, "roundTimer/current"), { isRunning: true, isPaused: false, startTime: Date.now(), pauseDuration: 0, lastPauseTime: null, endTime: null });
    setMessage("TIMER STARTED");
  };
  const pauseTimerRound = async () => {
    if (!timerData?.isRunning || timerData?.isPaused) return;
    await update(ref(db, "roundTimer/current"), { isPaused: true, isRunning: false, lastPauseTime: Date.now() });
    setMessage("TIMER PAUSED");
  };
  const resumeTimerRound = async () => {
    if (!timerData?.isPaused) return;
    const extraPause = Date.now() - timerData.lastPauseTime;
    await update(ref(db, "roundTimer/current"), { isPaused: false, isRunning: true, pauseDuration: (timerData.pauseDuration || 0) + extraPause, lastPauseTime: null });
    setMessage("TIMER RESUMED");
  };
  const endTimerRound = async () => {
    if (!confirm("End round?")) return;
    await update(ref(db, "roundTimer/current"), { isRunning: false, isPaused: false, endTime: Date.now() });
    setMessage("ROUND ENDED");
  };
  const nextRoundFull = async () => {
    const nextR = (timerData?.roundNumber || 1) + 1;
    if (!confirm(`Start Round ${nextR}?`)) return;
    
    await set(ref(db, "roundTimer/current"), { isRunning: true, isPaused: false, startTime: Date.now(), pauseDuration: 0, lastPauseTime: null, endTime: null, roundNumber: nextR, durationMinutes: 15 });
    await set(ref(db, "round/current"), nextR);
    setMessage(`ROUND ${nextR} STARTED`);
  };
  const prevRoundFull = async () => {
    const prevR = Math.max(1, (timerData?.roundNumber || 1) - 1);
    if (!confirm(`Go back to Round ${prevR}?`)) return;
    await update(ref(db, "roundTimer/current"), { roundNumber: prevR });
    await set(ref(db, "round/current"), prevR);
    setMessage(`BACK TO ROUND ${prevR}`);
  };

  // --- NEWS LOGIC ---
  const publishNews = async () => {
    if (!news.trim()) return setMessage("Write news first!");
    const id = Date.now().toString();
    await set(ref(db, `pendingNews/${id}`), { id, text: news, severity, stocks: selectedStocks, impact: impactPercent, newsTriggered: false, priceTriggered: false, timestamp: Number(id) });
    setNews(""); setSelectedStocks({}); setImpactPercent(10); setMessage("NEWS QUEUED");
  };
  const triggerNewsOnly = async (id) => {
    const n = pendingNews[id]; if (!n || n.newsTriggered) return;
    
    try {
      // Add news to live feed with proper structure
      await push(ref(db, "liveNews"), { 
        ...n, 
        newsTriggered: true, 
        newsTriggerTime: Date.now(),
        priceTriggered: n.priceTriggered || false // Preserve existing priceTriggered status
      });
      
      // Update pendingNews to mark news as triggered
      await set(ref(db, `pendingNews/${id}/newsTriggered`), true);
      
      setMessage("NEWS FLASHED TO DASHBOARD");
    } catch (err) {
      console.error("News trigger error:", err);
      setMessage("Error triggering news");
    }
  };
  const triggerPriceOnly = async (id) => {
    const n = pendingNews[id]; if (!n || n.priceTriggered) return;
    
    try {
      // Update stock prices
      for (const [sym, apply] of Object.entries(n.stocks || {})) {
        if (!apply) continue;
        const price = stocks[sym]?.price || 100;
        const dir = Math.random() > 0.5 ? 1 : -1;
        await set(ref(db, `stocks/${sym}/price`), Math.round(price * (1 + (n.impact / 100) * dir) * 100) / 100);
      }
      
      // Update pendingNews to mark price as triggered
      await set(ref(db, `pendingNews/${id}/priceTriggered`), true);
      
      // Also update the corresponding item in liveNews if it exists
      const liveNewsRef = ref(db, "liveNews");
      const snapshot = await get(liveNewsRef);
      
      if (snapshot.exists()) {
        const liveNewsData = snapshot.val();
        const updates = {};
        Object.entries(liveNewsData).forEach(([key, news]) => {
          if (news && (news.id === id || news.timestamp === id)) {
            updates[`liveNews/${key}/priceTriggered`] = true;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      }
      
      setMessage("PRICE TRIGGERED - AFFECTED STOCKS NOW VISIBLE");
    } catch (err) {
      console.error("Price trigger error:", err);
      setMessage("Error triggering price");
    }
  };
  const deleteNews = async (id) => {
    try {
      // Remove from pendingNews
      await remove(ref(db, `pendingNews/${id}`));
      
      // Also remove from liveNews if it exists there
      const liveNewsRef = ref(db, "liveNews");
      const snapshot = await get(liveNewsRef);
      
      if (snapshot.exists()) {
        const liveNewsData = snapshot.val();
        // Find and remove the news item with matching id
        const updates = {};
        Object.entries(liveNewsData).forEach(([key, news]) => {
          if (news && (news.id === id || news.timestamp === id)) {
            updates[`liveNews/${key}`] = null;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      }
      
      setMessage("NEWS DELETED FROM ALL LOCATIONS");
    } catch (err) {
      console.error("Delete news error:", err);
      setMessage("Error deleting news: " + err.message);
    }
  };

  // Function to clear all live news
  const clearAllLiveNews = async () => {
    if (!confirm("Clear ALL market updates from dashboard? This cannot be undone.")) return;
    
    try {
      await set(ref(db, "liveNews"), null);
      setMessage("ALL MARKET UPDATES CLEARED");
    } catch (err) {
      console.error("Clear all news error:", err);
      setMessage("Error clearing news: " + err.message);
    }
  };

  // User Management Functions
  const addNewUser = async () => {
    if (!newUserEmail.trim() || !newUserName.trim() || !newUserPassword.trim()) {
      setMessage("Please enter email, name, and password");
      return;
    }

    if (!newUserEmail.includes('@')) {
      setMessage("Please enter a valid email address");
      return;
    }

    if (newUserPassword.length < 6) {
      setMessage("Password must be at least 6 characters long");
      return;
    }

    const cash = Number(newUserCash);
    if (isNaN(cash) || cash < 0) {
      setMessage("Please enter a valid cash amount");
      return;
    }

    try {
      // Check if email already exists
      const existingUsers = participants.find(p => p.email === newUserEmail.trim());
      if (existingUsers) {
        setMessage("A user with this email already exists");
        return;
      }

      // Generate a simple user ID (in real app, you'd use Firebase Auth)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await set(ref(db, `users/${userId}`), {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim(), // In production, this should be hashed
        cash: cash,
        holdings: {},
        createdAt: Date.now(),
        createdBy: "admin"
      });

      // Also store credentials for login (simple approach for demo)
      const encodedEmail = encodeEmail(newUserEmail.trim());
      await set(ref(db, `userCredentials/${encodedEmail}`), {
        userId: userId,
        password: newUserPassword.trim(),
        name: newUserName.trim(),
        email: newUserEmail.trim() // Store original email for reference
      });

      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setNewUserCash("100000");
      setShowAddUser(false);
      setMessage(`User ${newUserName} added successfully with login credentials`);
    } catch (err) {
      console.error("Add user error:", err);
      setMessage("Failed to add user: " + err.message);
    }
  };

  const deleteUser = async (userId, userName, userEmail) => {
    if (!userId || !userName) {
      setMessage("Invalid user data - cannot delete");
      return;
    }

    if (!confirm(`Delete user "${userName}" permanently? This will remove all their data including trades, holdings, and login credentials.`)) return;
    
    console.log("Deleting user:", { userId, userName, userEmail });
    setMessage("Deleting user...");
    
    try {
      // Step 1: Remove main user data
      await remove(ref(db, `users/${userId}`));
      console.log("User data removed");

      // Step 2: Remove trade history
      try {
        await remove(ref(db, `tradeHistory/${userId}`));
        console.log("Trade history removed");
      } catch (e) {
        console.log("No trade history to remove");
      }

      // Step 3: Remove round P&L
      try {
        await remove(ref(db, `roundPnL/${userId}`));
        console.log("Round P&L removed");
      } catch (e) {
        console.log("No round P&L to remove");
      }

      // Step 4: Remove user credentials if email exists
      if (userEmail && userEmail.trim() !== "" && userEmail !== "No email") {
        try {
          const encodedEmail = encodeEmail(userEmail);
          await remove(ref(db, `userCredentials/${encodedEmail}`));
          console.log("User credentials removed");
        } catch (e) {
          console.log("No user credentials to remove");
        }
      }
      
      setMessage(`User ${userName} deleted successfully`);
    } catch (err) {
      console.error("Delete user error:", err);
      setMessage("Failed to delete user: " + err.message);
    }
  };
  const freeze = () => set(ref(db, "game/frozen"), true).then(() => setMessage("TRADING FROZEN"));
  const unfreeze = () => set(ref(db, "game/frozen"), false).then(() => setMessage("TRADING UNLOCKED"));

  // --- CALCULATIONS ---
  const elapsed = timerData?.startTime ? Math.floor((Date.now() - timerData.startTime - (timerData.pauseDuration || 0)) / 1000 / 60) : 0;
  const timeLeft = Math.max(0, (timerData?.durationMinutes || 15) - elapsed);
  const timerStatus = timerData?.isRunning ? (timerData?.isPaused ? "PAUSED" : "RUNNING") : (timerData?.endTime ? "ENDED" : "IDLE");

  const getPortfolioValue = (p) => {
    const holdingsVal = Object.entries(p.holdings || {}).reduce((acc, [sym, qty]) => {
      return acc + (stocks[sym]?.price || 0) * qty;
    }, 0);
    return (p.cash || 0) + holdingsVal;
  };

  if (!isAuth) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1114] via-[#141519] to-[#1a1d23] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-[400px] h-[400px] bg-gradient-to-r from-gray-500/10 via-white/5 to-gray-400/8 rounded-full blur-[80px] animate-pulse" style={{animationDuration: '8s'}} />
        <div className="absolute bottom-1/3 right-1/6 w-[350px] h-[350px] bg-gradient-to-l from-gray-600/8 via-white/3 to-gray-500/5 rounded-full blur-[70px] animate-pulse" style={{animationDuration: '12s', animationDelay: '2s'}} />
      </div>
      
      <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl border border-gray-400/30 shadow-2xl shadow-white/10 p-12 w-full max-w-md relative z-10">
        <form onSubmit={login} className="text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-300 via-white to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM2 8a6 6 0 1010.257 5.743L12 14l-0.257-0.257A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-2">Admin Control</h1>
            <p className="text-gray-400 text-sm">Enter credentials to access management panel</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-4 text-lg bg-gray-800/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 backdrop-blur-sm transition-all duration-300" 
                placeholder="Enter admin password"
                autoFocus 
              />
            </div>
            
            <div className="flex items-center justify-start">
              <label className="flex items-center gap-3 text-sm text-gray-300">
                <input 
                  type="checkbox" 
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 bg-gray-700 border border-gray-600 rounded focus:ring-white/50 focus:ring-2 text-white"
                />
                <span>Keep me signed in</span>
              </label>
            </div>
            
            <button className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-gray-300 to-white hover:from-white hover:to-gray-200 text-black rounded-xl transition-all duration-300 shadow-lg hover:shadow-white/30 transform hover:scale-105">
              Access Control Panel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1114] via-[#141519] to-[#1a1d23] relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-[600px] h-[600px] bg-gradient-to-r from-gray-500/5 via-white/3 to-gray-400/4 rounded-full blur-[120px] animate-pulse" style={{animationDuration: '8s'}} />
        <div className="absolute bottom-1/3 right-1/6 w-[500px] h-[500px] bg-gradient-to-l from-gray-600/4 via-white/2 to-gray-500/3 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '12s', animationDelay: '2s'}} />
      </div>
      
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl border border-gray-400/30 shadow-2xl shadow-white/10 mb-8 p-6">
            <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-100">Stock Exchange Admin Panel</h1>
              <p className="text-gray-300 mt-2">Manage rounds, stocks, news, and participants</p>
            </div>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* STATUS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6">
            <p className="text-sm font-medium text-blue-400 mb-1">Current Round</p>
            <p className="text-3xl font-bold text-gray-100">{timerData?.roundNumber || 1}</p>
          </div>
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6">
            <p className="text-sm font-medium text-green-400 mb-1">Market Status</p>
            <p className={`text-3xl font-bold ${isFrozen ? "text-red-400" : "text-green-400"}`}>
              {isFrozen ? "Frozen" : "Live"}
            </p>
          </div>
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6">
            <p className="text-sm font-medium text-red-400 mb-1">Timer ({timerStatus})</p>
            <p className={`text-3xl font-bold ${timeLeft <= 2 ? "text-red-400" : "text-gray-100"}`}>
              {timeLeft} min
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/60 to-blue-900/60 rounded-xl shadow-2xl shadow-white/10 border border-purple-600/50 backdrop-blur-sm p-6">
            <p className="text-sm font-medium text-purple-300 mb-1">System Health</p>
            <p className="text-3xl font-bold text-green-400">Online</p>
          </div>
          <div className="bg-gradient-to-br from-orange-900/60 to-red-900/60 rounded-xl shadow-2xl shadow-white/10 border border-orange-600/50 backdrop-blur-sm p-6">
            <p className="text-sm font-medium text-orange-300 mb-1">Platform Status</p>
            <p className="text-lg font-bold text-green-400">Active</p>
          </div>
        </div>

        {/* TIMER CONTROLS */}
        <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Round Timer Controls</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={startTimerRound} 
              disabled={timerData?.isRunning} 
              className="py-3 px-4 font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-800/60 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Start Timer
            </button>
            <button 
              onClick={pauseTimerRound} 
              disabled={!timerData?.isRunning} 
              className="py-3 px-4 font-medium bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-gray-800/60 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Pause Timer
            </button>
            <button 
              onClick={resumeTimerRound} 
              disabled={!timerData?.isPaused} 
              className="py-3 px-4 font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-800/60 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Resume Timer
            </button>
            <button 
              onClick={endTimerRound} 
              disabled={!timerData?.isRunning && !timerData?.isPaused} 
              className="py-3 px-4 font-medium bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-800/60 disabled:text-gray-500 rounded-lg transition-colors"
            >
              End Round
            </button>
          </div>
        </div>

        {/* STOCK CONTROL CENTER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* MANUAL PRICES & LOCKING */}
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-100">Stock Management</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddStock(!showAddStock)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  {showAddStock ? "Cancel" : "➕ Add New Stock"}
                </button>
                {Object.keys(pendingPrices).length > 0 && (
                  <button 
                    onClick={() => {
                      Object.keys(pendingPrices).forEach(sym => triggerPriceChange(sym));
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm transition-colors"
                  >
                    Trigger All ({Object.keys(pendingPrices).length})
                  </button>
                )}
                <button 
                  onClick={publishAndLockRound} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  Lock Round {timerData?.roundNumber}
                </button>
              </div>
            </div>
            
            {/* ADD NEW STOCK FORM */}
              {showAddStock && (
                <div className="bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 border border-gray-600/50 rounded-xl p-6 mb-6 backdrop-blur-sm">
                  <h4 className="text-lg font-semibold text-gray-100 mb-4">Add New Stock</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Stock Symbol *</label>
                      <input 
                        type="text" 
                        placeholder="e.g., AAPL, RELIANCE"
                        value={newStockSymbol}
                        onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 backdrop-blur-sm transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Company Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Apple Inc., Reliance Industries"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 backdrop-blur-sm transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Initial Price (₹) *</label>
                      <input 
                        type="number" 
                        placeholder="e.g., 150.00"
                        value={newStockPrice}
                        onChange={(e) => setNewStockPrice(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 backdrop-blur-sm transition-all duration-300"
                        step="0.01"
                      />
                    </div>
                  <div className="flex items-end">
                    <button
                        onClick={detectCompanyLogo}
                        disabled={isDetectingLogo || !newStockSymbol.trim()}
                        className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-300 disabled:from-gray-800 disabled:to-gray-900 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-gray-500/30 border border-gray-600/50"
                    >
                      {isDetectingLogo ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Detecting...</span>
                        </>
                      ) : (
                        <span>🔍 Detect Logo</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Logo Detection Result */}
                {logoDetectionResult && (
                    <div className="mb-4 p-4 bg-gray-900/60 rounded-xl border border-gray-600/50 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border">
                        {logoDetectionResult.logoUrl ? (
                          <img
                            src={logoDetectionResult.logoUrl}
                            alt={logoDetectionResult.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ 
                            backgroundColor: logoDetectionResult.color,
                            display: logoDetectionResult.logoUrl ? 'none' : 'flex'
                          }}
                        >
                          {logoDetectionResult.symbol.substring(0, 2)}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-100 font-medium">{logoDetectionResult.name}</p>
                        <p className="text-gray-300 text-sm">{logoDetectionResult.sector}</p>
                        {logoDetectionResult.domain && (
                          <p className="text-blue-400 text-xs">Domain: {logoDetectionResult.domain}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                    <button 
                      onClick={addNewStock}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/30 transform hover:scale-105"
                    >
                      Add Stock
                    </button>
                    <button
                      onClick={() => {
                        setShowAddStock(false);
                        setLogoDetectionResult(null);
                        setNewStockSymbol("");
                        setNewStockPrice("");
                        setNewCompanyName("");
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-gray-500/30 transform hover:scale-105 border border-gray-600/50"
                    >
                      Cancel
                    </button>
                </div>
                
                  <p className="text-xs text-gray-400 mt-4">
                    💡 Tip: Add company name for better logo detection. Logos are fetched automatically from company websites.
                  </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4 max-h-[750px] overflow-y-auto">
              {Object.entries(stocks).map(([sym, data]) => {
                const hasPendingChange = pendingPrices[sym] !== undefined;
                const pendingPrice = pendingPrices[sym];
                const currentPrice = data.price;
                
                return (
                  <div key={sym} className={`p-4 rounded-lg border-2 transition-colors ${
                    hasPendingChange ? "bg-gradient-to-br from-yellow-900/60 via-yellow-800/60 to-yellow-900/60 border-yellow-400/50" : "bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 border-gray-600/50"
                  }`}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-100">{sym}</span>
                        <button
                          onClick={() => deleteStock(sym)}
                          className="px-2 py-1 bg-red-900/60 hover:bg-red-800/80 text-red-300 text-xs font-medium rounded transition-colors border border-red-700/50"
                          title="Delete stock"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-300">Current: ₹{currentPrice}</span>
                        {hasPendingChange && (
                          <div className="text-sm text-yellow-300 font-medium">
                            Pending: ₹{pendingPrice}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        defaultValue={currentPrice}
                        onChange={(e) => updatePendingPrice(sym, e.target.value)}
                        className="flex-1 bg-gray-800/60 border border-gray-600/50 p-2 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 placeholder-gray-400 backdrop-blur-sm"
                        step="0.01"
                      />
                      
                      {hasPendingChange ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => triggerPriceChange(sym)}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                            title="Apply price change"
                          >
                            ✓ Trigger
                          </button>
                          <button
                            onClick={() => cancelPriceChange(sym)}
                            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                            title="Cancel price change"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled
                          className="px-3 py-2 bg-gray-800/40 text-gray-500 text-sm font-medium rounded-lg border border-gray-700/50"
                        >
                          No Changes
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

            {/* MARKET DYNAMICS */}
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Market Dynamics</h3>
            
            {/* Volume Chart */}
            <div className="space-y-4 mb-6">
              {Object.entries(stocks).map(([symbol, data]) => {
                const symbolOrderBook = orderBook[symbol] || { buyers: 0, sellers: 0, volume: 0 };
                const buyPressure = symbolOrderBook.buyers || 0;
                const sellPressure = symbolOrderBook.sellers || 0;
                const totalPressure = buyPressure + sellPressure;
                const buyPercentage = totalPressure > 0 ? (buyPressure / totalPressure) * 100 : 50;
                
                return (
                  <div key={symbol} className="p-3 bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 rounded-lg border border-gray-600/50 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-100">{symbol}</span>
                      <span className="text-sm text-gray-300">₹{Number(data.price).toFixed(2)}</span>
                    </div>
                    
                    {/* Buy/Sell Pressure Bar */}
                    <div className="w-full h-4 bg-red-200 rounded-full overflow-hidden mb-1">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${buyPercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Buyers: {buyPressure}</span>
                      <span>Vol: {symbolOrderBook.volume || 0}</span>
                      <span>Sellers: {sellPressure}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Chaos Mode */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-100 mb-2">Price Fluctuation</h4>
              <p className="mb-4 text-sm text-gray-300">Randomly fluctuates prices ±2% every 3 seconds</p>
              <button 
                onClick={() => setIsFluctuating(!isFluctuating)}
                className={`w-full py-3 font-medium rounded-lg transition-colors ${
                  isFluctuating 
                    ? "bg-orange-600 text-white hover:bg-orange-700" 
                    : "bg-gray-800/60 text-gray-100 hover:bg-gray-700/80 border border-gray-600/50"
                }`}
              >
                {isFluctuating ? "Stop Fluctuation" : "Start Fluctuation"}
              </button>
            </div>
          </div>
        </div>

        {/* ROUND HISTORY TABLE */}
        <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Round History (Locked Prices)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-600/50">
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">Round</th>
                  {Object.keys(stocks).map(s => <th key={s} className="py-3 px-4 text-sm font-medium text-gray-300 text-right">{s}</th>)}
                  <th className="py-3 px-4 text-sm font-medium text-gray-300 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(roundHistory).sort().map(roundKey => (
                  <tr key={roundKey} className="border-b border-gray-700/50 hover:bg-gray-800/40">
                    <td className="py-3 px-4 font-medium text-gray-100">
                      {roundKey.replace("round", "Round ")}
                    </td>
                    {Object.keys(stocks).map(stock => (
                      <td key={stock} className="py-3 px-4 text-right font-mono text-gray-200">
                        ₹{roundHistory[roundKey].prices?.[stock]?.toFixed(2) || "-"}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteRound(roundKey)}
                        className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800/80 text-red-300 text-sm font-medium rounded-lg transition-colors border border-red-700/50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* If no rounds yet */}
            {Object.keys(roundHistory).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No rounds locked yet. Lock Round 1 to begin tracking history.</p>
              </div>
            )}
          </div>
        </div>

        {/* NEWS CREATOR */}
        <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-100">News Publisher</h3>
            <button 
              onClick={clearAllLiveNews}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors"
            >
              Clear All Market Updates
            </button>
          </div>
          <textarea 
            value={news} 
            onChange={(e) => setNews(e.target.value)} 
            placeholder="Enter breaking news content..." 
            className="w-full p-4 border border-gray-600/50 rounded-lg mb-4 text-gray-100 bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 placeholder-gray-400 backdrop-blur-sm" 
            rows={4} 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select 
              value={severity} 
              onChange={(e) => setSeverity(e.target.value)} 
              className="p-3 border border-gray-600/50 rounded-lg text-gray-100 bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 backdrop-blur-sm"
            >
              <option value="mild">Mild Impact</option>
              <option value="moderate">Moderate Impact</option>
              <option value="severe">Severe Impact</option>
            </select>
            <input 
              type="number" 
              value={impactPercent} 
              onChange={(e) => setImpactPercent(+e.target.value)} 
              placeholder="Impact Percentage" 
              className="p-3 border border-gray-600/50 rounded-lg text-gray-100 bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 placeholder-gray-400 backdrop-blur-sm" 
            />
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-300 mb-2">Select affected stocks:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(stocks).map(s => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={selectedStocks[s] || false} 
                    onChange={(e) => setSelectedStocks({ ...selectedStocks, [s]: e.target.checked })} 
                    className="rounded border-gray-600/50 text-blue-400 focus:ring-blue-500 bg-gray-800/60"
                  />
                  <span className="text-gray-300">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <button 
            onClick={publishNews} 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Queue News
          </button>
        </div>

        {/* PENDING NEWS LIST */}
        {Object.keys(pendingNews).length > 0 && (
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Pending News Items</h3>
            <div className="space-y-4">
              {Object.entries(pendingNews).sort(([, a], [, b]) => b.timestamp - a.timestamp).map(([id, n]) => (
                <div key={id} className="bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 rounded-lg p-4 border border-gray-600/50">
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      n.severity === 'severe' ? 'bg-red-100 text-red-800' :
                      n.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    } mb-2`}>
                      {n.severity.toUpperCase()}
                    </span>
                    <p className="text-gray-100 font-medium">{n.text}</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Affects: {Object.keys(n.stocks || {}).filter(s => n.stocks[s]).join(", ")} (±{n.impact}%)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => triggerNewsOnly(id)} 
                      disabled={n.newsTriggered} 
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        n.newsTriggered ? "bg-gray-800/60 text-gray-500" : "bg-yellow-600 hover:bg-yellow-700 text-white"
                      }`}
                    >
                      {n.newsTriggered ? "News Shown" : "Show News"}
                    </button>
                    <button 
                      onClick={() => triggerPriceOnly(id)} 
                      disabled={n.priceTriggered} 
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        n.priceTriggered ? "bg-gray-800/60 text-gray-500" : "bg-orange-600 hover:bg-orange-700 text-white"
                      }`}
                    >
                      {n.priceTriggered ? "Price Updated" : "Trigger Price"}
                    </button>
                    <button 
                      onClick={() => deleteNews(id)} 
                      className="px-4 py-2 text-sm font-medium bg-red-900/60 hover:bg-red-800/80 text-red-300 rounded-lg transition-colors border border-red-700/50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USER MANAGEMENT */}
        <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-100">User Management ({participants.length} users)</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddUser(!showAddUser)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {showAddUser ? "Cancel" : "Add User"}
              </button>
              <button 
                onClick={resetAllPortfolios} 
                className="px-4 py-2 bg-red-900/60 hover:bg-red-800/80 text-red-300 font-medium rounded-lg text-sm transition-colors border border-red-700/50"
              >
                Reset All Data
              </button>
            </div>
          </div>

          {/* ADD USER FORM */}
          {showAddUser && (
            <div className="bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 border border-gray-600/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
              <h4 className="text-md font-semibold text-gray-100 mb-3">Add New User</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input 
                  type="email" 
                  placeholder="Email address"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="px-3 py-2 border border-gray-600/50 rounded-lg text-gray-100 bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 placeholder-gray-400 backdrop-blur-sm"
                />
                <input 
                  type="text" 
                  placeholder="Full Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="px-3 py-2 border border-gray-600/50 rounded-lg text-gray-100 bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 placeholder-gray-400 backdrop-blur-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input 
                  type="password" 
                  placeholder="Password (min 6 chars)"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="px-3 py-2 border border-gray-600/50 rounded-lg text-gray-100 bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 placeholder-gray-400 backdrop-blur-sm"
                  minLength="6"
                />
                <input 
                  type="number" 
                  placeholder="Starting Cash"
                  value={newUserCash}
                  onChange={(e) => setNewUserCash(e.target.value)}
                  className="px-3 py-2 border border-gray-600/50 rounded-lg text-gray-100 bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 placeholder-gray-400 backdrop-blur-sm"
                  step="1000"
                />
                <button 
                  onClick={addNewUser}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Add User
                </button>
              </div>
            </div>
          )}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {participants.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No users found. Add your first user above.</p>
              </div>
            ) : (
              participants
                .sort((a, b) => getPortfolioValue(b) - getPortfolioValue(a))
                .map((p, index) => (
                <div key={p.uid} className="flex justify-between items-center bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 p-3 rounded-lg border border-gray-600/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                    <div>
                      <div className="font-medium text-gray-100">{p.name || "Player"}</div>
                      <div className="text-xs text-gray-400">{p.email || "No email"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-medium text-gray-100">₹{getPortfolioValue(p).toLocaleString()}</div>
                      <div className="text-xs text-gray-400">
                        Cash: ₹{(p.cash || 0).toLocaleString()} | Holdings: {Object.keys(p.holdings || {}).length}
                      </div>

                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          console.log("User data:", p);
                          deleteUser(p.uid, p.name || "Player", p.email || "");
                        }}
                        className="px-3 py-1 bg-red-900/60 hover:bg-red-800/80 text-red-300 text-xs font-medium rounded transition-colors border border-red-700/50"
                        title="Delete user"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SYSTEM STATISTICS DASHBOARD */}
        <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">System Statistics Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 rounded-lg p-4 border border-blue-600/50 backdrop-blur-sm">
              <p className="text-sm font-medium text-blue-300 mb-1">System Uptime</p>
              <p className="text-2xl font-bold text-blue-100">
                100%
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 rounded-lg p-4 border border-purple-600/50 backdrop-blur-sm">
              <p className="text-sm font-medium text-purple-300 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-purple-100">
                {participants.length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-900/60 to-emerald-900/60 rounded-lg p-4 border border-green-600/50 backdrop-blur-sm">
              <p className="text-sm font-medium text-green-300 mb-1">Active Positions</p>
              <p className="text-2xl font-bold text-green-100">
                0
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 rounded-lg p-4 border border-yellow-600/50 backdrop-blur-sm">
              <p className="text-sm font-medium text-yellow-600 mb-1">Total Trades Today</p>
              <p className="text-2xl font-bold text-yellow-900">
                0
              </p>
            </div>
          </div>


        </div>

        {/* ROUND NAVIGATION */}
        <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-white/10 border border-gray-400/30 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Round Management</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={prevRoundFull} 
              className="py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              ← Previous Round
            </button>
            <button 
              onClick={freeze} 
              className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Freeze Trading
            </button>
            <button 
              onClick={unfreeze} 
              className="py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Unfreeze Trading
            </button>
            <button 
              onClick={nextRoundFull} 
              className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Next Round →
            </button>
          </div>
        </div>

          {message && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 backdrop-blur-xl shadow-2xl border border-gray-400/30 px-6 py-4 rounded-xl">
                <p className="text-sm font-medium text-gray-100">{message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}