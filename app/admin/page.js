"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
// We use 'remove' from Realtime Database instead of 'deleteDoc' from Firestore
import { ref, push, set, remove, onValue, update, get } from "firebase/database";

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
  const [showAddStock, setShowAddStock] = useState(false);

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

  const addNewStock = async () => {
    if (!newStockSymbol.trim() || !newStockPrice) {
      setMessage("Please enter both symbol and price");
      return;
    }

    const symbol = newStockSymbol.trim().toUpperCase();
    const price = Number(newStockPrice);

    if (stocks[symbol]) {
      setMessage("Stock symbol already exists");
      return;
    }

    if (price <= 0) {
      setMessage("Price must be greater than 0");
      return;
    }

    try {
      await set(ref(db, `stocks/${symbol}`), {
        price: price,
        symbol: symbol,
        createdAt: Date.now()
      });
      setNewStockSymbol("");
      setNewStockPrice("");
      setShowAddStock(false);
      setMessage(`Stock ${symbol} added successfully`);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-12 w-full max-w-md border border-gray-200">
        <form onSubmit={login} className="text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Enter admin credentials to continue</p>
          </div>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-4 text-lg border border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4" 
            placeholder="Enter admin password"
            autoFocus 
          />
          <div className="flex items-center justify-start mb-6">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input 
                type="checkbox" 
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Keep me signed in</span>
            </label>
          </div>
          <button className="w-full py-4 text-lg font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-900">Stock Exchange Admin Panel</h1>
              <p className="text-gray-600 mt-2">Manage rounds, stocks, news, and participants</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Current Round</p>
            <p className="text-3xl font-bold text-gray-900">{timerData?.roundNumber || 1}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Market Status</p>
            <p className={`text-3xl font-bold ${isFrozen ? "text-red-600" : "text-green-600"}`}>
              {isFrozen ? "Frozen" : "Live"}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Timer ({timerStatus})</p>
            <p className={`text-3xl font-bold ${timeLeft <= 2 ? "text-red-600" : "text-gray-900"}`}>
              {timeLeft} min
            </p>
          </div>
        </div>

        {/* TIMER CONTROLS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Round Timer Controls</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={startTimerRound} 
              disabled={timerData?.isRunning} 
              className="py-3 px-4 font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Start Timer
            </button>
            <button 
              onClick={pauseTimerRound} 
              disabled={!timerData?.isRunning} 
              className="py-3 px-4 font-medium bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-gray-300 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Pause Timer
            </button>
            <button 
              onClick={resumeTimerRound} 
              disabled={!timerData?.isPaused} 
              className="py-3 px-4 font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Resume Timer
            </button>
            <button 
              onClick={endTimerRound} 
              disabled={!timerData?.isRunning && !timerData?.isPaused} 
              className="py-3 px-4 font-medium bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 rounded-lg transition-colors"
            >
              End Round
            </button>
          </div>
        </div>

        {/* STOCK CONTROL CENTER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* MANUAL PRICES & LOCKING */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Stock Management</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddStock(!showAddStock)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  {showAddStock ? "Cancel" : "Add Stock"}
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Add New Stock</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input 
                    type="text" 
                    placeholder="Stock Symbol (e.g., APPLE)"
                    value={newStockSymbol}
                    onChange={(e) => setNewStockSymbol(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input 
                    type="number" 
                    placeholder="Initial Price"
                    value={newStockPrice}
                    onChange={(e) => setNewStockPrice(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                  />
                  <button 
                    onClick={addNewStock}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Add Stock
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
              {Object.entries(stocks).map(([sym, data]) => {
                const hasPendingChange = pendingPrices[sym] !== undefined;
                const pendingPrice = pendingPrices[sym];
                const currentPrice = data.price;
                
                return (
                  <div key={sym} className={`p-4 rounded-lg border-2 transition-colors ${
                    hasPendingChange ? "bg-yellow-50 border-yellow-300" : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{sym}</span>
                        <button
                          onClick={() => deleteStock(sym)}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded transition-colors"
                          title="Delete stock"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600">Current: ₹{currentPrice}</span>
                        {hasPendingChange && (
                          <div className="text-sm text-yellow-700 font-medium">
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
                        className="flex-1 bg-white border border-gray-300 p-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="px-3 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg"
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Dynamics</h3>
            
            {/* Volume Chart */}
            <div className="space-y-4 mb-6">
              {Object.entries(stocks).map(([symbol, data]) => {
                const symbolOrderBook = orderBook[symbol] || { buyers: 0, sellers: 0, volume: 0 };
                const buyPressure = symbolOrderBook.buyers || 0;
                const sellPressure = symbolOrderBook.sellers || 0;
                const totalPressure = buyPressure + sellPressure;
                const buyPercentage = totalPressure > 0 ? (buyPressure / totalPressure) * 100 : 50;
                
                return (
                  <div key={symbol} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{symbol}</span>
                      <span className="text-sm text-gray-600">₹{Number(data.price).toFixed(2)}</span>
                    </div>
                    
                    {/* Buy/Sell Pressure Bar */}
                    <div className="w-full h-4 bg-red-200 rounded-full overflow-hidden mb-1">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${buyPercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-600">
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
              <h4 className="font-medium text-gray-900 mb-2">Price Fluctuation</h4>
              <p className="mb-4 text-sm text-gray-600">Randomly fluctuates prices ±2% every 3 seconds</p>
              <button 
                onClick={() => setIsFluctuating(!isFluctuating)}
                className={`w-full py-3 font-medium rounded-lg transition-colors ${
                  isFluctuating 
                    ? "bg-orange-600 text-white hover:bg-orange-700" 
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300"
                }`}
              >
                {isFluctuating ? "Stop Fluctuation" : "Start Fluctuation"}
              </button>
            </div>
          </div>
        </div>

        {/* ROUND HISTORY TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Round History (Locked Prices)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-sm font-medium text-gray-600">Round</th>
                  {Object.keys(stocks).map(s => <th key={s} className="py-3 px-4 text-sm font-medium text-gray-600 text-right">{s}</th>)}
                  <th className="py-3 px-4 text-sm font-medium text-gray-600 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(roundHistory).sort().map(roundKey => (
                  <tr key={roundKey} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {roundKey.replace("round", "Round ")}
                    </td>
                    {Object.keys(stocks).map(stock => (
                      <td key={stock} className="py-3 px-4 text-right font-mono text-gray-700">
                        ₹{roundHistory[roundKey].prices?.[stock]?.toFixed(2) || "-"}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteRound(roundKey)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
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
              <div className="text-center py-8 text-gray-500">
                <p>No rounds locked yet. Lock Round 1 to begin tracking history.</p>
              </div>
            )}
          </div>
        </div>

        {/* NEWS CREATOR */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">News Publisher</h3>
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
            className="w-full p-4 border border-gray-300 rounded-lg mb-4 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            rows={4} 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select 
              value={severity} 
              onChange={(e) => setSeverity(e.target.value)} 
              className="p-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="p-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Select affected stocks:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(stocks).map(s => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={selectedStocks[s] || false} 
                    onChange={(e) => setSelectedStocks({ ...selectedStocks, [s]: e.target.checked })} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{s}</span>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending News Items</h3>
            <div className="space-y-4">
              {Object.entries(pendingNews).sort(([, a], [, b]) => b.timestamp - a.timestamp).map(([id, n]) => (
                <div key={id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      n.severity === 'severe' ? 'bg-red-100 text-red-800' :
                      n.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    } mb-2`}>
                      {n.severity.toUpperCase()}
                    </span>
                    <p className="text-gray-900 font-medium">{n.text}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Affects: {Object.keys(n.stocks || {}).filter(s => n.stocks[s]).join(", ")} (±{n.impact}%)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => triggerNewsOnly(id)} 
                      disabled={n.newsTriggered} 
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        n.newsTriggered ? "bg-gray-300 text-gray-500" : "bg-yellow-600 hover:bg-yellow-700 text-white"
                      }`}
                    >
                      {n.newsTriggered ? "News Shown" : "Show News"}
                    </button>
                    <button 
                      onClick={() => triggerPriceOnly(id)} 
                      disabled={n.priceTriggered} 
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        n.priceTriggered ? "bg-gray-300 text-gray-500" : "bg-orange-600 hover:bg-orange-700 text-white"
                      }`}
                    >
                      {n.priceTriggered ? "Price Updated" : "Trigger Price"}
                    </button>
                    <button 
                      onClick={() => deleteNews(id)} 
                      className="px-4 py-2 text-sm font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Management ({participants.length} users)</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddUser(!showAddUser)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {showAddUser ? "Cancel" : "Add User"}
              </button>
              <button 
                onClick={resetAllPortfolios} 
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg text-sm transition-colors"
              >
                Reset All Data
              </button>
            </div>
          </div>

          {/* ADD USER FORM */}
          {showAddUser && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Add New User</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input 
                  type="email" 
                  placeholder="Email address"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <input 
                  type="text" 
                  placeholder="Full Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input 
                  type="password" 
                  placeholder="Password (min 6 chars)"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  minLength="6"
                />
                <input 
                  type="number" 
                  placeholder="Starting Cash"
                  value={newUserCash}
                  onChange={(e) => setNewUserCash(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <div className="text-center py-8 text-gray-500">
                <p>No users found. Add your first user above.</p>
              </div>
            ) : (
              participants
                .sort((a, b) => getPortfolioValue(b) - getPortfolioValue(a))
                .map((p, index) => (
                <div key={p.uid} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div>
                      <div className="font-medium text-gray-900">{p.name || "Player"}</div>
                      <div className="text-xs text-gray-500">{p.email || "No email"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-medium text-gray-900">₹{getPortfolioValue(p).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        Cash: ₹{(p.cash || 0).toLocaleString()} | Holdings: {Object.keys(p.holdings || {}).length}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        console.log("User data:", p);
                        deleteUser(p.uid, p.name || "Player", p.email || "");
                      }}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
                      title="Delete user"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ROUND NAVIGATION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Round Management</h3>
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
            <div className="bg-white shadow-lg border border-gray-200 px-6 py-3 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}