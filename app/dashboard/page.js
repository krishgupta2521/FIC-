"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, set, runTransaction, push, get } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  Wallet,
  BarChart3,
  PieChart,
  Activity,
  Users,
  LogOut,
  Timer,
  AlertCircle,
  Search,
  Bell,
  Home,
  Target,
  X,
  Settings,
  Plus,
  Minus,
  RefreshCw,
  Star,
  Filter,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stocks, setStocks] = useState({});
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ cash: 100000, holdings: {}, name: "Player" });
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");

  // --- TIMER & GAME STATE ---
  const [timerData, setTimerData] = useState(null);
  const [displayTime, setDisplayTime] = useState("15:00");
  const [liveNews, setLiveNews] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [round, setRound] = useState(1);

  // --- HISTORY STATE ---
  const [tradeHistory, setTradeHistory] = useState([]);
  const [roundPnL, setRoundPnL] = useState({});
  const [roundHistory, setRoundHistory] = useState({});
  
  // --- MARKET DYNAMICS STATE ---
  const [marketData, setMarketData] = useState({});
  const [orderBook, setOrderBook] = useState({});
  const [showMarketDynamics, setShowMarketDynamics] = useState(false);
  
  // --- NAVIGATION TRANSITION STATE ---
  const [isNavigating, setIsNavigating] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);

  // 1. Timer Listener
  useEffect(() => {
    const timerRef = ref(db, "roundTimer/current");
    const unsubscribe = onValue(timerRef, (snap) => {
      const data = snap.val();
      setTimerData(data);
      if (data?.roundNumber) setRound(data.roundNumber);
    });
    return () => unsubscribe();
  }, []);

  // 2. Visual Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (!timerData) return;
      if (timerData.endTime) { setDisplayTime("00:00"); return; }
      if (!timerData.isRunning) { setDisplayTime("15:00"); return; }
      if (timerData.isPaused) return;
      const now = Date.now();
      const elapsed = Math.floor((now - timerData.startTime - (timerData.pauseDuration || 0)) / 1000);
      const totalSeconds = (timerData.durationMinutes || 15) * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);
      const m = Math.floor(remaining / 60).toString().padStart(2, "0");
      const s = (remaining % 60).toString().padStart(2, "0");
      setDisplayTime(`${m}:${s}`);
    }, 500);
    return () => clearInterval(interval);
  }, [timerData]);

  // --- AUTH & DATA LISTENERS ---
  useEffect(() => {
    // Check for admin-created user first
    const adminUser = localStorage.getItem('adminCreatedUser');
    if (adminUser) {
      try {
        const userData = JSON.parse(adminUser);
        setUser({ uid: userData.userId, email: userData.email, isAdminCreated: true });
        return;
      } catch (err) {
        console.error("Error parsing admin user data:", err);
        localStorage.removeItem('adminCreatedUser');
      }
    }
    
    // Otherwise use Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        // If no Firebase user and no admin user, redirect to login
        if (!adminUser) {
          window.location.href = "/";
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snap) => {
      const data = snap.val();
      if (data) {
        setUserData({ ...data, name: data.name || user.email?.split("@")[0] || "Player" });
      } else {
        // Only create new user data for Firebase Auth users, not admin-created ones
        if (!user.isAdminCreated) {
          set(userRef, { cash: 100000, holdings: {}, name: user.email?.split("@")[0] || "Player" });
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const stocksRef = ref(db, "stocks");
    return onValue(stocksRef, (snap) => {
      if (snap.exists()) setStocks(snap.val());
    });
  }, []);

  useEffect(() => {
    const historyRef = ref(db, "roundHistory");
    return onValue(historyRef, (snap) => {
      setRoundHistory(snap.val() || {});
    });
  }, []);

  useEffect(() => {
    const newsRef = ref(db, "liveNews");
    return onValue(newsRef, (snap) => {
      const data = snap.val();
      if (!data) { setLiveNews([]); return; }
      const newsArray = Object.values(data)
        .filter((n) => n.newsTriggered === true)
        .sort((a, b) => (b.newsTriggerTime || 0) - (a.newsTriggerTime || 0));
      setLiveNews(newsArray);
    });
  }, []);

  useEffect(() => {
    const frozenRef = ref(db, "game/frozen");
    return onValue(frozenRef, (snap) => setIsFrozen(snap.val() === true));
  }, []);

  useEffect(() => {
    if (!user) return;
    const histRef = ref(db, `tradeHistory/${user.uid}`);
    return onValue(histRef, (snap) => {
      const data = snap.val();
      if (data) setTradeHistory(Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      else setTradeHistory([]);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const pnlRef = ref(db, `roundPnL/${user.uid}`);
    return onValue(pnlRef, (snap) => setRoundPnL(snap.val() || {}));
  }, [user]);

  useEffect(() => {
    // Market Data Listener
    const marketRef = ref(db, "marketData");
    const unsubscribeMarket = onValue(marketRef, (snap) => {
      setMarketData(snap.val() || {});
    });

    // Order Book Listener
    const orderRef = ref(db, "orderBook");
    const unsubscribeOrder = onValue(orderRef, (snap) => {
      setOrderBook(snap.val() || {});
    });

    return () => {
      unsubscribeMarket();
      unsubscribeOrder();
    };
  }, []);

  // --- MARKET DYNAMICS FUNCTIONS ---
  const updateMarketDynamics = async (symbol, type, quantity, price) => {
    try {
      const orderBookRef = ref(db, `orderBook/${symbol}`);
      const snapshot = await get(orderBookRef);
      
      const currentData = snapshot.exists() ? snapshot.val() : { buyers: 0, sellers: 0, volume: 0 };
      
      // Update buyer/seller pressure
      let newBuyers = currentData.buyers || 0;
      let newSellers = currentData.sellers || 0;
      
      if (type === "BUY") {
        newBuyers += quantity;
      } else {
        newSellers += quantity;
      }
      
      // Update volume
      const newVolume = (currentData.volume || 0) + quantity;
      
      // Calculate price impact based on buy/sell pressure
      const totalPressure = newBuyers + newSellers;
      const buyPressure = totalPressure > 0 ? newBuyers / totalPressure : 0.5;
      
      // Price impact formula: ±0.5% to ±3% based on pressure imbalance and volume
      const pressureImbalance = Math.abs(buyPressure - 0.5) * 2; // 0 to 1
      const volumeImpact = Math.min(quantity / 100, 0.02); // Max 2% from volume
      const priceImpact = (pressureImbalance * 0.025) + volumeImpact; // 0% to 4.5%
      
      let newPrice = price;
      if (buyPressure > 0.6) {
        // More buyers - price goes up
        newPrice = price * (1 + priceImpact);
      } else if (buyPressure < 0.4) {
        // More sellers - price goes down  
        newPrice = price * (1 - priceImpact);
      }
      
      // Update order book
      await set(orderBookRef, {
        buyers: newBuyers,
        sellers: newSellers,
        volume: newVolume,
        lastUpdate: Date.now()
      });
      
      // Update stock price if there's significant impact
      if (Math.abs(newPrice - price) > 0.01) {
        await set(ref(db, `stocks/${symbol}/price`), Number(newPrice.toFixed(2)));
      }
      
    } catch (err) {
      console.error("Market dynamics update failed:", err);
    }
  };

  // --- HELPERS ---

  const portfolioValue = (userData?.cash || 0) +
    Object.entries(userData.holdings || {}).reduce((acc, [sym, qty]) => {
      const price = Number(stocks[sym]?.price || 0);
      return acc + price * qty;
    }, 0);

  const stockList = Object.keys(stocks).length > 0 
    ? Object.keys(stocks) 
    : ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL", "ITC", "SBI"];

  // --- TRADE LOGIC ---
  const handleTrade = async (type) => {
    setMessage("");
    if (isFrozen) return setMessage("TRADING IS FROZEN BY ADMIN");
    if (timerData?.endTime) return setMessage("ROUND ENDED - TRADING CLOSED");
    if (timerData?.isPaused) return setMessage("MARKET PAUSED");
    try {
      if (!user) return setMessage("Not signed in");
      if (!selectedStock) return setMessage("Select a stock first");
      const priceRaw = stocks[selectedStock]?.price;
      const currentPrice = Number(priceRaw);
      if (!priceRaw || Number.isNaN(currentPrice)) return setMessage("Stock not loaded yet");
      const qty = Math.floor(Number(quantity));
      if (!qty || qty < 1) return setMessage("Enter valid quantity");
      const total = currentPrice * qty;
      const userRef = ref(db, `users/${user.uid}`);
      await runTransaction(userRef, (current) => {
        if (current === null) current = { cash: 100000, holdings: {}, name: "Player" };
        const holdings = { ...(current.holdings || {}) };
        const owned = Number(holdings[selectedStock] || 0);
        if (type === "BUY") {
          if ((Number(current.cash) || 0) < total) throw new Error("NOT_ENOUGH_CASH");
          holdings[selectedStock] = owned + qty;
          current.cash = (Number(current.cash) || 0) - total;
        } else {
          if (owned < qty) throw new Error("NOT_ENOUGH_SHARES");
          const newQty = owned - qty;
          if (newQty <= 0) delete holdings[selectedStock];
          else holdings[selectedStock] = newQty;
          current.cash = (Number(current.cash) || 0) + total;
        }
        current.holdings = holdings;
        return current;
      });
      setMessage(`${type === "BUY" ? "BOUGHT" : "SOLD"} ${qty} ${selectedStock}`);
      setQuantity("");
      await push(ref(db, `tradeHistory/${user.uid}`), {
        type, symbol: selectedStock, quantity: qty, price: currentPrice,
        total: Math.round(currentPrice * qty * 100) / 100,
        cashChange: type === "BUY" ? -currentPrice * qty : currentPrice * qty,
        timestamp: Date.now(), round: round
      });

      // Update market dynamics
      await updateMarketDynamics(selectedStock, type, qty, currentPrice);
    } catch (err) {
      if (err?.message === "NOT_ENOUGH_CASH") setMessage("Not enough cash!");
      else if (err?.message === "NOT_ENOUGH_SHARES") setMessage("Not enough shares!");
      else setMessage("Trade failed");
    }
  };

  if (!user || Object.keys(stocks).length === 0) {
    return (
      <div className="min-h-screen bg-[#141519] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-100 mb-2">Loading Market Data</h2>
          <p className="text-gray-400">Please wait while we fetch the latest prices...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
      <div className="min-h-screen bg-[#141519] relative overflow-hidden">

      {/* Modern Glassmorphism Header */}
      <header className="bg-[#1a1d23] border-b border-gray-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-100">FIC Hansraj Stock Exchange</h1>
                  <p className="text-xs text-gray-400 -mt-0.5">Live Trading Platform</p>
                </div>
              </div>
              
              {/* Enhanced Market Status Indicator */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  isFrozen || timerData?.isPaused ? "bg-red-500" : "bg-green-500"
                }`}></div>
                <span className={`text-sm font-medium ${
                  isFrozen || timerData?.isPaused ? "text-red-400" : "text-green-400"
                }`}>
                  {isFrozen ? "Frozen" : timerData?.isPaused ? "Paused" : "Live"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Navigation Links */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsNavigating(true);
                  setPageTransition(true);
                  setTimeout(() => {
                    window.location.href = '/trade-history';
                  }, 600);
                }}
                disabled={isNavigating}
                className="group flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-gradient-to-r from-gray-800 to-gray-750 hover:from-blue-600 hover:to-blue-700 rounded-xl border border-gray-600 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isNavigating ? (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Activity size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                )}
                <span className="hidden sm:inline">{isNavigating ? 'Loading...' : 'Trade History'}</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsNavigating(true);
                  setPageTransition(true);
                  setTimeout(() => {
                    window.location.href = '/leaderboard';
                  }, 600);
                }}
                disabled={isNavigating}
                className="group flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-gradient-to-r from-gray-800/90 via-gray-750/90 to-gray-800/90 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 rounded-xl border border-gray-600/60 hover:border-amber-400/80 transition-all duration-300 shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02] backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isNavigating ? (
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trophy size={16} className="group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 drop-shadow-sm" />
                )}
                <span className="hidden sm:inline font-semibold tracking-wide">{isNavigating ? 'Loading...' : 'Leaderboard'}</span>
              </button>

              {/* Enhanced User Info Card */}
              <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg border border-gray-600">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {userData.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-gray-100 font-medium text-sm hidden sm:inline">{userData.name}</span>
              </div>
              
              {/* Enhanced Logout Button */}
              <button
                onClick={() => {
                  // Handle logout for both Firebase and admin-created users
                  if (user?.isAdminCreated) {
                    localStorage.removeItem('adminCreatedUser');
                    window.location.href = "/";
                  } else {
                    signOut(auth);
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">

        {/* Modern Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#1a1d23] rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Wallet size={20} className="text-white" />
                </div>
                <span className="text-gray-100 font-medium">Portfolio Value</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">₹{portfolioValue.toLocaleString("en-IN")}</p>
              <p className="text-sm text-gray-400">Available: ₹{userData.cash?.toLocaleString("en-IN") || '0'}</p>
            </div>
          </div>
          
          <div className="bg-[#1a1d23] rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  timerData?.isRunning && !timerData?.isPaused 
                    ? "bg-blue-600" 
                    : "bg-red-600"
                }`}>
                  <Timer size={20} className="text-white" />
                </div>
                <span className="text-gray-100 font-medium">Round {round}</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                isFrozen || timerData?.isPaused ? "bg-red-500" : "bg-green-500"
              }`}></div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold font-mono text-white">{displayTime}</p>
              <p className={`text-sm ${
                isFrozen || timerData?.isPaused ? "text-red-400" : "text-green-400"
              }`}>
                {isFrozen ? "Market Frozen" : timerData?.isPaused ? "Market Paused" : "Live Trading"}
              </p>
            </div>
          </div>
          
          <div className="bg-[#1a1d23] rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <span className="text-gray-100 font-medium">Holdings</span>
              </div>
              <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">{Object.keys(userData.holdings || {}).length} stocks</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">{Object.keys(userData.holdings || {}).length}</p>
              <p className="text-sm text-gray-400">Active positions</p>
            </div>
          </div>
        </div>

        {/* Modern Market News */}
        {liveNews.length > 0 && (
          <div className="bg-[#1a1d23] rounded-xl border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                    <AlertCircle size={16} className="text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-100">Market Updates</span>
                </div>
                <span className="bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded border border-gray-600">
                  {liveNews.length} {liveNews.length === 1 ? 'Update' : 'Updates'}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {liveNews.slice(0, 5).map((news, index) => (
                <div key={news.id || index} className={`p-4 rounded-lg border-l-4 bg-gray-800 hover:bg-gray-750 transition-colors ${
                  news.severity === 'severe' ? 'border-red-500' :
                  news.severity === 'moderate' ? 'border-yellow-500' :
                  'border-blue-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${
                      news.severity === 'severe' ? 'text-red-300 bg-red-900/50' :
                      news.severity === 'moderate' ? 'text-yellow-300 bg-yellow-900/50' :
                      'text-blue-300 bg-blue-900/50'
                    }`}>
                      {news.severity || 'Breaking'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {news.newsTriggerTime ? new Date(news.newsTriggerTime).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {news.text}
                  </p>
                  {news.priceTriggered && news.stocks && Object.keys(news.stocks).filter(s => news.stocks[s]).length > 0 && (
                    <div className="mt-3 p-3 bg-gray-900 rounded-lg border border-gray-600">
                      <span className="text-xs text-gray-400 font-medium">Affected stocks: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.keys(news.stocks).filter(s => news.stocks[s]).map(stock => (
                          <span key={stock} className="text-xs font-medium text-white bg-blue-600 px-2 py-1 rounded">
                            {stock}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {liveNews.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-gray-500">
                    Showing latest 5 of {liveNews.length} updates
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modern Market Dynamics Section */}
        {selectedStock && (
          <div 
            id="market-dynamics"
            className={`bg-[#1a1d23] rounded-xl border border-gray-700 transition-all duration-700 ease-out transform ${
              showMarketDynamics 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-4 scale-95'
            }`}
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
                    <BarChart3 size={16} className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-100">Market Dynamics - {selectedStock}</h2>
                </div>
                <button 
                  onClick={() => {
                    setShowMarketDynamics(false);
                    setTimeout(() => setSelectedStock(null), 300);
                  }}
                  className="w-8 h-8 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center border border-gray-600 hover:border-red-500 transition-colors"
                >
                  <X size={16} className="text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const stockData = stocks[selectedStock];
                const symbolOrderBook = orderBook[selectedStock] || { buyers: 0, sellers: 0, volume: 0 };
                const buyPressure = symbolOrderBook.buyers || 0;
                const sellPressure = symbolOrderBook.sellers || 0;
                const totalPressure = buyPressure + sellPressure;
                const buyPercentage = totalPressure > 0 ? (buyPressure / totalPressure) * 100 : 50;
                const trend = buyPercentage > 60 ? "up" : buyPercentage < 40 ? "down" : "neutral";
                
                return (
                  <div className="max-w-2xl mx-auto">
                    {/* Stock Header */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          trend === "up" ? "bg-green-600" :
                          trend === "down" ? "bg-red-600" :
                          "bg-gray-600"
                        }`}>
                          {trend === "up" ? (
                            <TrendingUp size={24} className="text-white" />
                          ) : trend === "down" ? (
                            <TrendingDown size={24} className="text-white" />
                          ) : (
                            <Activity size={24} className="text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-100">{selectedStock}</h3>
                          <p className="text-lg font-semibold text-gray-300">₹{Number(stockData?.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded text-sm font-medium ${
                        trend === "up" ? "bg-green-900 text-green-300" :
                        trend === "down" ? "bg-red-900 text-red-300" :
                        "bg-gray-800 text-gray-300"
                      }`}>
                        {trend === "up" ? "Bullish" : trend === "down" ? "Bearish" : "Neutral"}
                      </div>
                    </div>

                    {/* Market Pressure Visualization */}
                    <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
                      <h4 className="text-lg font-semibold text-gray-100 mb-4">Market Pressure</h4>
                      
                      {/* Large Pressure Bar */}
                      <div className="relative mb-4">
                        <div className="w-full h-6 bg-red-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-out"
                            style={{ width: `${buyPercentage}%` }}
                          ></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-100">
                            {buyPercentage.toFixed(1)}% Buy Pressure
                          </span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <ArrowUp size={24} className="text-white" />
                          </div>
                          <div className="text-2xl font-bold text-green-400">{buyPressure}</div>
                          <div className="text-sm text-gray-300">Active Buyers</div>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <BarChart3 size={24} className="text-white" />
                          </div>
                          <div className="text-2xl font-bold text-blue-400">{symbolOrderBook.volume || 0}</div>
                          <div className="text-sm text-gray-300">Total Volume</div>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <ArrowDown size={24} className="text-white" />
                          </div>
                          <div className="text-2xl font-bold text-red-400">{sellPressure}</div>
                          <div className="text-sm text-gray-300">Active Sellers</div>
                        </div>
                      </div>
                    </div>

                    {/* Trading Tip */}
                    <div className={`p-4 rounded-lg border-l-4 bg-gray-800 border border-gray-700 ${
                      trend === "up" ? "border-l-green-500" :
                      trend === "down" ? "border-l-red-500" :
                      "border-l-blue-500"
                    }`}>
                      <div className="flex items-start space-x-3">
                        <Target size={20} className={`mt-0.5 ${
                          trend === "up" ? "text-green-400" :
                          trend === "down" ? "text-red-400" :
                          "text-blue-400"
                        }`} />
                        <div>
                          <p className="font-medium text-gray-100">Market Insight</p>
                          <p className={`text-sm ${
                            trend === "up" ? "text-green-300" :
                            trend === "down" ? "text-red-300" :
                            "text-blue-300"
                          }`}>
                            {trend === "up" ? 
                              "Strong buying pressure detected. Consider buying opportunities." :
                            trend === "down" ? 
                              "Heavy selling pressure observed. Exercise caution or consider short positions." :
                              "Balanced market conditions. Good time for strategic entries."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Modern Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Modern Stock List */}
          <div className="lg:col-span-4">
            <div className="bg-[#1a1d23] rounded-xl border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <BarChart3 size={16} className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-100">Live Market</h2>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {Object.entries(stocks).map(([sym, data]) => {
                  const price = Number(data.price);
                  const prevPrice = price * (1 + (Math.random() - 0.5) * 0.02); // Mock previous price for demo
                  const change = price - prevPrice;
                  const changePercent = (change / prevPrice) * 100;
                  const isPositive = change >= 0;
                  const owned = userData.holdings?.[sym] || 0;
                  const isSelected = selectedStock === sym;
                  
                  return (
                    <div
                      key={sym}
                      onClick={() => {
                        setSelectedStock(sym);
                        setShowMarketDynamics(false);
                        setTimeout(() => {
                          setShowMarketDynamics(true);
                          // Smooth scroll to market dynamics section after opening
                          setTimeout(() => {
                            const marketDynamicsElement = document.querySelector('#market-dynamics');
                            if (marketDynamicsElement) {
                              marketDynamicsElement.scrollIntoView({ 
                                behavior: 'smooth',
                                block: 'center'
                              });
                            }
                          }, 400);
                        }, 100);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-300 border hover:scale-[1.01] ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500/50 shadow-lg"
                          : "bg-gray-800/80 border-gray-600/50 hover:bg-gray-700/80 hover:border-gray-500/60"
                      }`}
                    >
                      {/* Stock Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isSelected ? 'bg-blue-400' : isPositive ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <h3 className={`font-bold text-sm ${
                            isSelected ? 'text-blue-200' : 'text-gray-100'
                          }`}>
                            {sym}
                          </h3>
                          {owned > 0 && (
                            <span className="bg-green-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                              {owned}
                            </span>
                          )}
                        </div>
                        
                        {/* Change Amount */}
                        <div className={`text-xs font-semibold px-2 py-1 rounded ${
                          isPositive 
                            ? "text-green-300 bg-green-600/30" 
                            : "text-red-300 bg-red-600/30"
                        }`}>
                          {isPositive ? "+" : ""}₹{Math.abs(change).toFixed(2)}
                        </div>
                      </div>
                      
                      {/* Price and Change */}
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold font-mono ${
                          isSelected ? 'text-white' : 'text-gray-100'
                        }`}>
                          ₹{price.toFixed(2)}
                        </span>
                        
                        <div className={`flex items-center space-x-1 text-xs font-bold ${
                          isPositive ? "text-green-400" : "text-red-400"
                        }`}>
                          {isPositive ? (
                            <TrendingUp size={12} />
                          ) : (
                            <TrendingDown size={12} />
                          )}
                          <span>{isPositive ? "+" : ""}{changePercent.toFixed(2)}%</span>
                        </div>
                      </div>
                      
                      {/* Holdings Info */}
                      {owned > 0 && (
                        <div className="mt-2 text-xs text-green-400">
                          Value: ₹{(owned * price).toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modern Trading Panel */}
          <div className="lg:col-span-5">
            <div className="bg-[#1a1d23] rounded-xl border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Activity size={16} className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-100">
                    {selectedStock ? `Trade ${selectedStock}` : "Trading Interface"}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {selectedStock && stocks[selectedStock] ? (
                  <div className="space-y-8">
                    {/* Enhanced Stock Info */}
                    <div className="text-center py-4 bg-gray-800 rounded-lg border border-gray-700">
                      <h3 className="text-2xl font-bold text-gray-100 mb-3">{selectedStock}</h3>
                      <p className="text-4xl font-bold text-white">₹{Number(stocks[selectedStock].price).toFixed(2)}</p>
                      <div className="mt-2 flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-medium">Live Price</span>
                      </div>
                    </div>

                    {/* Enhanced Quantity Input */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-300">Quantity</label>
                      <input
                        type="number"
                        placeholder="Enter quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none text-center font-medium transition-colors"
                      />
                    </div>

                    {/* Enhanced Cash & Order Value */}
                    <div className="space-y-4">
                      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-300">Available Cash</span>
                          <span className="font-bold text-lg text-white">
                            ₹{userData.cash?.toLocaleString("en-IN") || '0'}
                          </span>
                        </div>
                      </div>
                      
                      {quantity && (
                        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-300">Order Value</span>
                            <span className="font-semibold text-gray-100">
                              ₹{(Number(quantity) * Number(stocks[selectedStock].price)).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Remaining Cash</span>
                            <span className={`text-xs font-medium ${
                              (userData.cash || 0) - (Number(quantity) * Number(stocks[selectedStock].price)) >= 0 
                                ? "text-green-400" : "text-red-400"
                            }`}>
                              ₹{((userData.cash || 0) - (Number(quantity) * Number(stocks[selectedStock].price))).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Trade Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleTrade("BUY")}
                        className="bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Plus size={18} />
                        <span>BUY</span>
                      </button>
                      <button
                        onClick={() => handleTrade("SELL")}
                        className="bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Minus size={18} />
                        <span>SELL</span>
                      </button>
                    </div>

                    {/* Message */}
                    {message && (
                      <div className={`p-3 rounded-lg border ${
                        message.includes("BOUGHT") || message.includes("SOLD")
                          ? "bg-green-900 border-green-600 text-green-300"
                          : "bg-red-900 border-red-600 text-red-300"
                      }`}>
                        <p className="text-center font-medium text-sm">{message}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Activity size={24} className="text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-sm">Click on a stock to start trading</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modern Trade History */}
          <div className="lg:col-span-3">
            <div className="bg-[#1a1d23] rounded-xl border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Activity size={16} className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-100">Recent Trades</h2>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {tradeHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Activity size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-400">No trades yet</p>
                  </div>
                ) : (
                  tradeHistory.slice(0, 10).map((t, i) => {
                    const avgPrice = t.quantity > 0 ? (Math.abs(t.cashChange) / t.quantity) : 0;
                    const isBuy = t.type === "BUY";
                    return (
                    <div key={i} className="p-3 bg-gray-800/80 border border-gray-600/50 rounded-lg hover:bg-gray-700/80 hover:border-gray-500/60 transition-all duration-300">
                      {/* Trade Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isBuy ? "bg-green-500" : "bg-red-500"
                          }`}></div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            isBuy ? "text-green-300 bg-green-600/30" : "text-red-300 bg-red-600/30"
                          }`}>
                            {t.type}
                          </span>
                          <span className="text-sm font-semibold text-gray-100">{t.symbol}</span>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">R{t.round}</span>
                      </div>
                      
                      {/* Trade Details */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">{t.quantity} shares</span>
                        <span className={`text-sm font-bold ${
                          isBuy ? "text-red-400" : "text-green-400"
                        }`}>
                          {t.cashChange > 0 ? "+" : ""}₹{Math.abs(t.cashChange).toLocaleString("en-IN")}
                        </span>
                      </div>
                      
                      {/* Trade Meta */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Avg: ₹{avgPrice.toFixed(2)}/share</span>
                        <span className="text-gray-400">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Holdings Section */}
        {Object.keys(userData.holdings || {}).length > 0 && (
          <div className="mt-8">
            <div className="bg-[#1a1d23] rounded-xl border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <PieChart size={16} className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-100">Your Holdings</h2>
                  <span className="bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded border border-gray-600">
                    {Object.keys(userData.holdings || {}).length} {Object.keys(userData.holdings || {}).length === 1 ? 'Position' : 'Positions'}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(userData.holdings || {}).map(([sym, qty]) => {
                  const currentPrice = Number(stocks[sym]?.price || 0);
                  const holdingValue = currentPrice * qty;
                  
                  return (
                    <div key={sym} className="p-4 bg-gray-800/80 border border-gray-600/50 rounded-lg hover:bg-gray-700/80 hover:border-gray-500/60 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {sym.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-100 text-lg">{sym}</h3>
                            <p className="text-sm text-gray-400">{qty} shares</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-white text-lg">₹{holdingValue.toLocaleString("en-IN")}</div>
                          <div className="text-sm text-green-400 font-medium">Current Value</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Avg. Price: ₹{currentPrice.toFixed(2)}/share</span>
                        <span className={`font-medium ${
                          holdingValue > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          P&L: ₹{((holdingValue - (qty * currentPrice)) || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modern Round History Section */}
        {Object.keys(roundHistory).length > 0 && (
          <div className="mt-8">
            <div className="bg-[#1a1d23] rounded-xl border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <BarChart3 size={16} className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-100">Round History</h2>
                  <span className="bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded border border-gray-600">
                    {Object.keys(roundHistory).length} {Object.keys(roundHistory).length === 1 ? 'Round' : 'Rounds'}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-100">Round</th>
                      {stockList.map((s) => (
                        <th key={s} className="px-4 py-3 text-right text-sm font-semibold text-gray-100">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {Object.entries(roundHistory)
                      .sort()
                      .map(([roundKey, data]) => (
                        <tr key={roundKey} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-100">
                            {roundKey.replace("round", "Round ")}
                          </td>
                          {stockList.map((stock) => (
                            <td key={stock} className="px-4 py-3 text-right font-mono text-gray-300 text-sm">
                              {data.prices?.[stock] ? `₹${data.prices[stock].toFixed(2)}` : "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Page Transition Overlay */}
      {pageTransition && (
        <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center transition-all duration-600">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg font-medium">Loading...</p>
            <div className="mt-3 flex space-x-1 justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}