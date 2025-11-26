"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, set, runTransaction, push, get, update } from "firebase/database";
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
import CompanyLogo from '../components/CompanyLogo';

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
    
    // Market pressure decay - runs every 30 seconds
    const decayInterval = setInterval(decayMarketPressure, 30000);

    return () => {
      unsubscribeMarket();
      unsubscribeOrder();
      clearInterval(decayInterval);
    };
  }, []);

  // --- ENHANCED MARKET DYNAMICS FUNCTIONS ---
  const updateMarketDynamics = async (symbol, type, quantity, price) => {
    try {
      const orderBookRef = ref(db, `orderBook/${symbol}`);
      const marketDataRef = ref(db, `marketData/${symbol}`);
      
      // Get current order book and market data
      const [orderSnapshot, marketSnapshot] = await Promise.all([
        get(orderBookRef),
        get(marketDataRef)
      ]);
      
      const currentOrderData = orderSnapshot.exists() ? orderSnapshot.val() : 
        { buyers: 0, sellers: 0, volume: 0, totalValue: 0, trades: 0 };
      const currentMarketData = marketSnapshot.exists() ? marketSnapshot.val() : 
        { volatility: 0.02, momentum: 0, avgPrice: price, priceHistory: [] };
      
      // Update trading statistics
      let newBuyers = currentOrderData.buyers || 0;
      let newSellers = currentOrderData.sellers || 0;
      const tradeValue = quantity * price;
      
      if (type === "BUY") {
        newBuyers += quantity;
      } else {
        newSellers += quantity;
      }
      
      // Enhanced volume and value tracking
      const newVolume = (currentOrderData.volume || 0) + quantity;
      const newTotalValue = (currentOrderData.totalValue || 0) + tradeValue;
      const newTrades = (currentOrderData.trades || 0) + 1;
      
      // Calculate Volume-Weighted Average Price (VWAP)
      const vwap = newTotalValue / newVolume;
      
      // Calculate market pressure with sophisticated algorithm
      const totalPressure = newBuyers + newSellers;
      const buyPressure = totalPressure > 0 ? newBuyers / totalPressure : 0.5;
      
      // Enhanced price impact calculation
      const pressureImbalance = Math.abs(buyPressure - 0.5) * 2; // 0 to 1
      
      // Volume impact: Large trades have more impact
      const relativeVolume = Math.min(quantity / 50, 1); // Normalize to 50 shares as base
      const volumeImpact = relativeVolume * 0.015; // Up to 1.5% impact from volume
      
      // Market depth simulation: More trades = less impact per trade
      const liquidityFactor = Math.max(0.3, 1 - (newTrades / 100)); // Decreases impact as liquidity increases
      
      // Momentum factor: Consecutive same-direction trades amplify impact
      const currentMomentum = currentMarketData.momentum || 0;
      const momentumDirection = type === "BUY" ? 1 : -1;
      const newMomentum = Math.max(-3, Math.min(3, currentMomentum + (momentumDirection * 0.3)));
      const momentumImpact = Math.abs(newMomentum) * 0.005; // Up to 1.5% momentum impact
      
      // Volatility adjustment: Recent price changes affect future sensitivity
      const currentVolatility = currentMarketData.volatility || 0.02;
      const volatilityMultiplier = 1 + (currentVolatility * 10); // Higher volatility = more price movement
      
      // Combined price impact formula
      let baseImpact = (pressureImbalance * 0.02) + volumeImpact + momentumImpact;
      baseImpact *= liquidityFactor * volatilityMultiplier;
      
      // Cap maximum impact per trade
      const maxImpact = Math.min(baseImpact, 0.08); // Maximum 8% impact per trade
      
      // Calculate new price
      let newPrice = price;
      if (buyPressure > 0.55) {
        // More buyers - price goes up
        newPrice = price * (1 + maxImpact * (buyPressure - 0.5) * 2);
      } else if (buyPressure < 0.45) {
        // More sellers - price goes down  
        newPrice = price * (1 - maxImpact * (0.5 - buyPressure) * 2);
      }
      
      // Update price history for volatility calculation
      const priceHistory = currentMarketData.priceHistory || [];
      priceHistory.push({ price: newPrice, timestamp: Date.now() });
      
      // Keep only last 20 price points
      if (priceHistory.length > 20) {
        priceHistory.shift();
      }
      
      // Calculate new volatility based on recent price movements
      let newVolatility = 0.02; // Base volatility
      if (priceHistory.length > 3) {
        const recentPrices = priceHistory.slice(-5).map(p => p.price);
        const priceChanges = [];
        for (let i = 1; i < recentPrices.length; i++) {
          priceChanges.push(Math.abs((recentPrices[i] - recentPrices[i-1]) / recentPrices[i-1]));
        }
        newVolatility = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
        newVolatility = Math.max(0.005, Math.min(0.1, newVolatility)); // Cap between 0.5% and 10%
      }
      
      // Update order book with enhanced data
      await set(orderBookRef, {
        buyers: newBuyers,
        sellers: newSellers,
        volume: newVolume,
        totalValue: newTotalValue,
        trades: newTrades,
        vwap: Number(vwap.toFixed(2)),
        buyPressure: Number(buyPressure.toFixed(3)),
        lastUpdate: Date.now(),
        lastTradeType: type,
        lastTradeQuantity: quantity
      });
      
      // Update market data
      await set(marketDataRef, {
        volatility: newVolatility,
        momentum: newMomentum,
        avgPrice: Number(vwap.toFixed(2)),
        priceHistory: priceHistory,
        lastImpact: maxImpact,
        liquidityFactor: liquidityFactor
      });
      
      // Update stock price if there's significant impact
      if (Math.abs(newPrice - price) > 0.005) { // Lowered threshold for more responsive pricing
        const finalPrice = Number(newPrice.toFixed(2));
        await set(ref(db, `stocks/${symbol}/price`), finalPrice);
        
        // Log significant price movements
        if (Math.abs(newPrice - price) > 0.02 * price) {
          console.log(`📈 ${symbol}: ₹${price} → ₹${finalPrice} (${((newPrice - price) / price * 100).toFixed(2)}%) - Volume: ${quantity}, Pressure: ${buyPressure.toFixed(2)}`);
        }
      }
      
    } catch (err) {
      console.error("Enhanced market dynamics update failed:", err);
    }
  };
  
  // Market decay function to gradually reduce order book pressure
  const decayMarketPressure = async () => {
    try {
      const orderBookSnapshot = await get(ref(db, 'orderBook'));
      if (!orderBookSnapshot.exists()) return;
      
      const orderBookData = orderBookSnapshot.val();
      const updates = {};
      
      Object.keys(orderBookData).forEach(symbol => {
        const data = orderBookData[symbol];
        if (data && data.lastUpdate) {
          const timeSinceUpdate = Date.now() - data.lastUpdate;
          
          // Decay pressure over time (5 minutes = 50% reduction)
          if (timeSinceUpdate > 30000) { // 30 seconds
            const decayFactor = Math.exp(-timeSinceUpdate / 300000); // 5-minute half-life
            
            updates[symbol] = {
              ...data,
              buyers: Math.max(0, (data.buyers || 0) * decayFactor),
              sellers: Math.max(0, (data.sellers || 0) * decayFactor)
            };
          }
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await update(ref(db, 'orderBook'), updates);
      }
      
    } catch (err) {
      console.error("Market pressure decay failed:", err);
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
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 1024px) {
          .nav-container {
            overflow-x: auto;
            white-space: nowrap;
          }
          .nav-container::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#0f1114] via-[#141519] to-[#1a1d23] relative overflow-hidden">
        {/* Premium Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/5 via-teal-400/3 to-cyan-400/2 rounded-full blur-[120px] animate-pulse" style={{animationDuration: '8s'}} />
          <div className="absolute bottom-1/3 right-1/6 w-[500px] h-[500px] bg-gradient-to-l from-blue-500/5 via-indigo-400/3 to-violet-400/2 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '12s', animationDelay: '2s'}} />
          <div className="absolute top-2/3 left-1/2 w-[400px] h-[400px] bg-gradient-to-t from-purple-500/4 via-fuchsia-400/2 to-pink-400/1 rounded-full blur-[90px] animate-pulse" style={{animationDuration: '10s', animationDelay: '4s'}} />
        </div>

      {/* Enhanced Premium Header */}
      <header className="bg-gradient-to-r from-[#1a1d23]/95 via-[#1f2128]/95 to-[#1a1d23]/95 border-b border-gray-600/50 sticky top-0 z-50 shadow-2xl backdrop-blur-xl">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-20 gap-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-black/90 via-gray-900/90 to-black/90 px-4 py-2 h-14 rounded-2xl border border-gray-400/30 backdrop-blur-sm shadow-xl shadow-white/10">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-white rounded-lg blur-sm opacity-60"></div>
                  <div className="relative w-8 h-8 bg-gradient-to-br from-gray-300 via-silver-400 to-white rounded-lg flex items-center justify-center shadow-lg">
                    <BarChart3 size={16} className="text-black" />
                  </div>
                </div>
                <div className="hidden lg:block">
                  <h1 className="text-base font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">FIC Hansraj Stock Exchange</h1>
                  <p className="text-xs text-gray-300 font-medium -mt-0.5">Live Trading Platform</p>
                </div>
                <div className="lg:hidden">
                  <h1 className="text-sm font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">FIC Hansraj</h1>
                </div>
              </div>
              
              {/* Enhanced Market Status Indicator */}
              <div className="flex items-center justify-center space-x-2 px-3 py-2 h-14 bg-gradient-to-r from-black/90 via-gray-900/90 to-black/90 border border-gray-400/30 rounded-2xl backdrop-blur-sm shadow-xl shadow-white/10">
                <div className={`w-2 h-2 rounded-full ${
                  isFrozen || timerData?.isPaused ? "bg-red-400 animate-pulse" : "bg-white animate-pulse shadow-white/50"
                }`}></div>
                <span className={`text-sm font-bold whitespace-nowrap ${
                  isFrozen || timerData?.isPaused ? "text-red-400" : "text-white"
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
                className="group flex items-center justify-center space-x-2 px-4 py-2 min-w-[120px] h-14 text-sm font-semibold text-gray-300 hover:text-white bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 hover:from-gray-600 hover:via-gray-500 hover:to-gray-400 rounded-2xl border border-gray-400/30 hover:border-white/60 backdrop-blur-sm transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-white/25 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-1"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-gray-400/20 to-white/20 rounded-lg flex items-center justify-center group-hover:from-gray-300 group-hover:to-white transition-all duration-300">
                  {isNavigating ? (
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Activity size={14} className="group-hover:rotate-12 transition-transform duration-300 text-gray-400 group-hover:text-black" />
                  )}
                </div>
                <span className="hidden lg:inline font-bold tracking-wide whitespace-nowrap text-xs">{isNavigating ? 'Loading...' : 'Trade History'}</span>
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
                className="group flex items-center justify-center space-x-2 px-4 py-2 min-w-[120px] h-14 text-sm font-semibold text-gray-300 hover:text-white bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 hover:from-gray-600 hover:via-gray-500 hover:to-gray-400 rounded-2xl border border-gray-400/30 hover:border-white/60 backdrop-blur-sm transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-white/25 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-1"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-gray-400/20 to-white/20 rounded-lg flex items-center justify-center group-hover:from-gray-300 group-hover:to-white transition-all duration-300">
                  {isNavigating ? (
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trophy size={14} className="group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 text-gray-400 group-hover:text-black drop-shadow-sm" />
                  )}
                </div>
                <span className="hidden lg:inline font-bold tracking-wide whitespace-nowrap text-xs">{isNavigating ? 'Loading...' : 'Leaderboard'}</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  setMessage('F&O feature is currently unavailable');
                  setTimeout(() => setMessage(''), 3000);
                }}
                disabled={true}
                className="group flex items-center justify-center space-x-2 px-4 py-2 min-w-[120px] h-14 text-sm font-semibold text-gray-500 bg-gradient-to-r from-gray-800/50 via-gray-700/50 to-gray-800/50 rounded-2xl border border-gray-600/30 backdrop-blur-sm opacity-50 cursor-not-allowed"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-gray-600/20 to-gray-500/20 rounded-lg flex items-center justify-center">
                  <Target size={14} className="text-gray-600" />
                </div>
                <span className="hidden lg:inline font-bold tracking-wide whitespace-nowrap text-xs">F&O</span>
              </button>

              {/* Enhanced User Info Card */}
              <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 px-4 py-2 min-w-[100px] h-14 rounded-2xl border border-gray-400/30 backdrop-blur-sm shadow-xl shadow-white/10">
                <div className="w-6 h-6 bg-gradient-to-br from-gray-300 via-white to-gray-200 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-xs">
                    {userData.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-gray-200 font-bold text-xs hidden lg:inline whitespace-nowrap">{userData.name || 'User'}</span>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={() => {
                  // Handle logout for both Firebase and admin-created users
                  localStorage.clear();
                  if (user?.isAdminCreated) {
                    localStorage.removeItem('adminCreatedUser');
                  } else {
                    signOut(auth);
                  }
                  window.location.href = '/';
                }}
                className="group flex items-center justify-center space-x-2 px-4 py-2 min-w-[100px] h-14 text-sm font-semibold text-gray-300 hover:text-white bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 hover:from-gray-700 hover:via-gray-600 hover:to-gray-500 rounded-2xl border border-gray-400/30 hover:border-white/60 backdrop-blur-sm transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-white/25 hover:scale-105 transform hover:-translate-y-1"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-gray-400/30 to-white/30 rounded-lg flex items-center justify-center group-hover:from-gray-300 group-hover:to-white transition-all duration-300">
                  <LogOut size={14} className="group-hover:rotate-12 transition-transform duration-300 text-gray-400 group-hover:text-black" />
                </div>
                <span className="hidden lg:inline font-bold tracking-wide whitespace-nowrap text-xs">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8">

        {/* Premium Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-400/30 hover:border-white/60 transition-all duration-300 shadow-2xl hover:shadow-white/20 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-300 to-white rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-white/30 group-hover:scale-110 transition-all duration-300">
                  <Wallet size={24} className="text-black drop-shadow-lg" />
                </div>
                <div>
                  <span className="text-gray-100 font-semibold text-lg bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">Portfolio Value</span>
                  <div className="text-xs text-gray-400 mt-1">Total Investment</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">₹{portfolioValue.toLocaleString("en-IN")}</p>
              <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-400/30">
                <p className="text-sm text-gray-300 font-medium">Available Cash: ₹{userData.cash?.toLocaleString("en-IN") || '0'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-400/30 hover:border-white/60 transition-all duration-300 shadow-2xl hover:shadow-white/20 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-300 ${
                  timerData?.isRunning && !timerData?.isPaused 
                    ? "bg-gradient-to-br from-gray-300 to-white group-hover:shadow-white/30" 
                    : "bg-gradient-to-br from-gray-600 to-gray-800 group-hover:shadow-gray-500/30"
                }`}>
                  <Timer size={24} className={timerData?.isRunning && !timerData?.isPaused ? "text-black drop-shadow-lg" : "text-white drop-shadow-lg"} />
                </div>
                <div>
                  <span className="text-gray-100 font-semibold text-lg">Round {round}</span>
                  <div className="text-xs text-gray-400 mt-1">Trading Session</div>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full shadow-lg ${
                isFrozen || timerData?.isPaused ? "bg-red-400 animate-pulse" : "bg-white animate-pulse shadow-white/50"
              }`}></div>
            </div>
            <div className="space-y-3">
              <p className="text-3xl font-bold font-mono bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">{displayTime}</p>
              <div className={`rounded-lg p-3 border ${
                isFrozen || timerData?.isPaused 
                  ? "bg-red-900/30 border-red-600/30" 
                  : "bg-green-900/30 border-green-600/30"
              }`}>
                <p className={`text-sm font-medium ${
                  isFrozen || timerData?.isPaused ? "text-red-300" : "text-green-300"
                }`}>
                  {isFrozen ? "Market Frozen" : timerData?.isPaused ? "Market Paused" : "Live Trading"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-400/30 hover:border-white/60 transition-all duration-300 shadow-2xl hover:shadow-white/20 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-300 to-white rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-white/30 group-hover:scale-110 transition-all duration-300">
                  <PieChart size={24} className="text-black drop-shadow-lg" />
                </div>
                <div>
                  <span className="text-gray-100 font-semibold text-lg">Holdings</span>
                  <div className="text-xs text-gray-400 mt-1">Stock Portfolio</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-600/20 to-gray-500/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-400/30">
                <span className="text-sm text-gray-300 font-semibold">{Object.keys(userData.holdings || {}).length} stocks</span>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">{Object.keys(userData.holdings || {}).length}</p>
              <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-400/30">
                <p className="text-sm text-gray-300 font-medium">Active Positions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Market News */}
        {liveNews.length > 0 && (
          <div className="bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-600/30 shadow-2xl">
            <div className="p-6 border-b border-gray-600/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <AlertCircle size={20} className="text-white drop-shadow-sm" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Market Updates</h2>
                    <p className="text-sm text-gray-400">Live market news feed</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-orange-500/30">
                  <span className="text-sm text-orange-300 font-semibold">
                    {liveNews.length} {liveNews.length === 1 ? 'Update' : 'Updates'}
                  </span>
                </div>
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
                      news.severity === 'severe' ? 'text-red-300 bg-gray-900/50' :
                      news.severity === 'moderate' ? 'text-yellow-300 bg-gray-900/50' :
                      'text-gray-300 bg-gray-900/50'
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
                          <span key={stock} className="text-xs font-medium text-black bg-gray-300 px-2 py-1 rounded">
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
            className={`bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 rounded-xl border border-gray-400/50 backdrop-blur-xl shadow-2xl shadow-white/10 transition-all duration-700 ease-out transform ${
              showMarketDynamics 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-4 scale-95'
            }`}
          >
            <div className="p-6 border-b border-gray-400/40 bg-gradient-to-r from-gray-600/20 via-gray-500/15 to-gray-600/20 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-white rounded-lg blur-sm opacity-50"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-gray-300 via-white to-gray-200 rounded-lg flex items-center justify-center shadow-lg">
                      <BarChart3 size={18} className="text-black" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">Market Dynamics - {selectedStock}</h2>
                    <p className="text-sm text-gray-400 font-medium">Real-time market analysis</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowMarketDynamics(false);
                    setTimeout(() => setSelectedStock(null), 300);
                  }}
                  className="w-10 h-10 bg-gradient-to-r from-black/80 to-gray-900/80 hover:from-gray-700 hover:to-gray-600 rounded-lg flex items-center justify-center border border-gray-400/50 hover:border-white/60 transition-all duration-300 shadow-lg hover:shadow-white/20"
                >
                  <X size={18} className="text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const stockData = stocks[selectedStock];
                const symbolOrderBook = orderBook[selectedStock] || { 
                  buyers: 0, sellers: 0, volume: 0, totalValue: 0, trades: 0, vwap: 0, buyPressure: 0.5 
                };
                const symbolMarketData = marketData[selectedStock] || {
                  volatility: 0.02, momentum: 0, avgPrice: stockData?.price || 0, liquidityFactor: 1
                };
                const buyPressure = symbolOrderBook.buyPressure || 0.5;
                const sellPressure = 1 - buyPressure;
                const totalPressure = (symbolOrderBook.buyers || 0) + (symbolOrderBook.sellers || 0);
                const buyPercentage = totalPressure > 0 ? (buyPressure / totalPressure) * 100 : 50;
                const trend = buyPercentage > 60 ? "up" : buyPercentage < 40 ? "down" : "neutral";
                
                return (
                  <div className="max-w-2xl mx-auto">
                    {/* Stock Header with Logo */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center space-x-4">
                        <CompanyLogo 
                          symbol={selectedStock} 
                          size={56} 
                          className="flex-shrink-0"
                          fallbackStyle="gradient"
                        />
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-2xl font-bold text-gray-100">{selectedStock}</h3>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              trend === "up" ? "bg-white" :
                              trend === "down" ? "bg-gray-600" :
                              "bg-gray-400"
                            }`}>
                              {trend === "up" ? (
                                <TrendingUp size={16} className="text-black" />
                              ) : trend === "down" ? (
                                <TrendingDown size={16} className="text-white" />
                              ) : (
                                <Activity size={16} className="text-white" />
                              )}
                            </div>
                          </div>
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
                        <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden">
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
                          <div className="text-2xl font-bold text-green-400">{(symbolOrderBook.buyers || 0).toLocaleString()}</div>
                          <div className="text-sm text-gray-300">Buy Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <BarChart3 size={24} className="text-white" />
                          </div>
                          <div className="text-2xl font-bold text-blue-400">{(symbolOrderBook.volume || 0).toLocaleString()}</div>
                          <div className="text-sm text-gray-300">Total Volume</div>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <ArrowDown size={24} className="text-white" />
                          </div>
                          <div className="text-2xl font-bold text-red-400">{(symbolOrderBook.sellers || 0).toLocaleString()}</div>
                          <div className="text-sm text-gray-300">Sell Orders</div>
                        </div>
                      </div>
                      
                      {/* Enhanced Market Metrics Row */}
                      <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-600/30">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-400">₹{symbolOrderBook.vwap || stockData?.price || 0}</div>
                          <div className="text-xs text-gray-400">VWAP</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            symbolMarketData.volatility > 0.05 ? 'text-red-400' : 
                            symbolMarketData.volatility > 0.03 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {(symbolMarketData.volatility * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-400">Volatility</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            symbolMarketData.momentum > 0 ? 'text-green-400' : 
                            symbolMarketData.momentum < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {symbolMarketData.momentum > 0 ? '+' : ''}{symbolMarketData.momentum.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">Momentum</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            (symbolMarketData.liquidityFactor || 1) > 0.8 ? 'text-green-400' :
                            (symbolMarketData.liquidityFactor || 1) > 0.5 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {((symbolMarketData.liquidityFactor || 1) * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-400">Liquidity</div>
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
            <div className="bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 rounded-2xl border border-gray-600/50 shadow-2xl backdrop-blur-xl">
              <div className="p-6 border-b border-gray-400/40 bg-gradient-to-r from-gray-600/20 via-gray-500/15 to-gray-600/20 rounded-t-2xl">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-white rounded-xl blur-sm opacity-50"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-gray-300 via-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                      <BarChart3 size={18} className="text-black" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      Live Market
                    </h2>
                    <p className="text-sm text-gray-300 font-medium">Real-time stock prices</p>
                  </div>
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
                          // Smooth scroll to trading interface section after opening
                          setTimeout(() => {
                            const tradingElement = document.querySelector('#trading-interface');
                            if (tradingElement) {
                              tradingElement.scrollIntoView({ 
                                behavior: 'smooth',
                                block: 'start'
                              });
                            }
                          }, 400);
                        }, 100);
                      }}
                      className={`group p-4 rounded-2xl cursor-pointer transition-all duration-500 border backdrop-blur-sm hover:scale-[1.02] ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-blue-600/20 border-blue-400/60 shadow-2xl shadow-blue-500/20"
                          : "bg-gradient-to-br from-gray-800/60 via-gray-750/50 to-gray-800/60 border-gray-600/40 hover:bg-gradient-to-br hover:from-gray-700/70 hover:via-gray-650/60 hover:to-gray-700/70 hover:border-gray-500/50 hover:shadow-xl hover:shadow-gray-900/50"
                      }`}
                    >
                      {/* Stock Header with Logo */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <CompanyLogo 
                            symbol={sym} 
                            size={36} 
                            className="flex-shrink-0"
                            fallbackStyle="gradient"
                          />
                          <div className="flex flex-col">
                            <h3 className={`font-bold text-sm ${
                              isSelected ? 'text-blue-200' : 'text-gray-100'
                            }`}>
                              {sym}
                            </h3>
                            {owned > 0 && (
                              <span className="bg-gray-300 text-black text-xs font-semibold px-1.5 py-0.5 rounded mt-1 w-fit">
                                {owned} shares
                              </span>
                            )}
                          </div>
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
            <div id="trading-interface" className="bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 rounded-2xl border border-gray-600/50 shadow-2xl backdrop-blur-xl">
              <div className="p-6 border-b border-gray-400/40 bg-gradient-to-r from-gray-600/20 via-gray-500/15 to-gray-600/20 rounded-t-2xl">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-white rounded-xl blur-sm opacity-50"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-gray-300 via-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                      <Activity size={18} className="text-black" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                      {selectedStock ? `Trade ${selectedStock}` : "Trading Interface"}
                    </h2>
                    <p className="text-sm text-gray-400">Execute your trades with precision</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {selectedStock && stocks[selectedStock] ? (
                  <div className="space-y-8">
                    {/* Enhanced Stock Info with Logo */}
                    <div className="text-center py-8 bg-gradient-to-br from-gray-800/80 via-gray-700/70 to-gray-800/80 rounded-xl border border-gray-600/50 shadow-xl backdrop-blur-sm">
                      <div className="flex flex-col items-center space-y-4">
                        <CompanyLogo 
                          symbol={selectedStock} 
                          size={64} 
                          showName={true}
                          className="flex flex-col items-center space-y-2"
                          fallbackStyle="gradient"
                        />
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">{selectedStock}</h3>
                          <p className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">₹{Number(stocks[selectedStock].price).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-sm font-medium">Live Price</span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Quantity Input */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">Quantity</label>
                      <input
                        type="number"
                        placeholder="Enter quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 border border-gray-600/60 focus:border-blue-500/80 focus:shadow-lg focus:shadow-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none text-center font-medium transition-all duration-300 backdrop-blur-sm"
                      />
                    </div>

                    {/* Enhanced Cash & Order Value */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-gray-800/80 via-gray-700/70 to-gray-800/80 border border-gray-600/60 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-300">Available Cash</span>
                          <span className="font-bold text-lg text-white">
                            ₹{userData.cash?.toLocaleString("en-IN") || '0'}
                          </span>
                        </div>
                      </div>
                      
                      {quantity && (
                        <div className="bg-gradient-to-br from-gray-800/90 via-gray-700/80 to-gray-800/90 border border-gray-600/60 rounded-xl p-5 shadow-xl backdrop-blur-sm">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">Order Value</span>
                            <span className="font-bold text-lg bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                              ₹{(Number(quantity) * Number(stocks[selectedStock].price)).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium">Remaining Cash</span>
                            <span className={`text-sm font-bold ${
                              (userData.cash || 0) - (Number(quantity) * Number(stocks[selectedStock].price)) >= 0 
                                ? "text-green-400" : "text-red-400"
                            }`}>
                              ₹{((userData.cash || 0) - (Number(quantity) * Number(stocks[selectedStock].price))).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Premium Trade Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleTrade("BUY")}
                        className="bg-gradient-to-r from-gray-300 to-white hover:from-white hover:to-gray-200 text-black font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-white/30 transform hover:scale-105"
                      >
                        <Plus size={18} />
                        <span>BUY</span>
                      </button>
                      <button
                        onClick={() => handleTrade("SELL")}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-gray-500/30 transform hover:scale-105"
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
            <div className="bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 rounded-2xl border border-gray-600/50 shadow-2xl backdrop-blur-xl">
              <div className="p-6 border-b border-gray-400/40 bg-gradient-to-r from-gray-600/20 via-gray-500/15 to-gray-600/20 rounded-t-2xl">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-white rounded-xl blur-sm opacity-50"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-gray-300 via-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                      <Activity size={18} className="text-black" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      Recent Trades
                    </h2>
                    <p className="text-sm text-gray-300 font-medium">Your trading activity</p>
                  </div>
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
            <div className="bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 rounded-2xl border border-gray-600/50 shadow-2xl backdrop-blur-xl">
              <div className="p-6 border-b border-gray-400/40 bg-gradient-to-r from-gray-600/20 via-gray-500/15 to-gray-600/20 rounded-t-2xl">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-white rounded-xl blur-sm opacity-50"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-gray-300 via-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                      <PieChart size={18} className="text-black" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      Your Holdings
                    </h2>
                    <p className="text-sm text-gray-300 font-medium">Portfolio positions</p>
                  </div>
                  <span className="bg-gradient-to-r from-black/80 to-gray-900/80 text-gray-200 text-sm px-4 py-2 rounded-xl border border-gray-400/50 backdrop-blur-sm shadow-lg">
                    {Object.keys(userData.holdings || {}).length} {Object.keys(userData.holdings || {}).length === 1 ? 'Position' : 'Positions'}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(userData.holdings || {}).map(([sym, qty]) => {
                  const currentPrice = Number(stocks[sym]?.price || 0);
                  const holdingValue = currentPrice * qty;
                  
                  return (
                    <div key={sym} className="p-5 bg-gradient-to-br from-black/80 via-gray-900/70 to-black/80 border border-gray-400/50 rounded-xl hover:from-gray-900/90 hover:via-gray-800/80 hover:to-gray-900/90 hover:border-white/60 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <CompanyLogo 
                            symbol={sym} 
                            size={48} 
                            className="flex-shrink-0"
                            fallbackStyle="gradient"
                          />
                          <div>
                            <h3 className="font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent text-lg">{sym}</h3>
                            <p className="text-sm text-gray-300 font-medium">{qty} shares</p>
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
            <div className="bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 rounded-2xl border border-gray-600/50 shadow-2xl backdrop-blur-xl">
              <div className="p-6 border-b border-gray-400/40 bg-gradient-to-r from-gray-600/20 via-gray-500/15 to-gray-600/20 rounded-t-2xl">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-white rounded-xl blur-sm opacity-50"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-gray-300 via-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                      <BarChart3 size={18} className="text-black" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      Round History
                    </h2>
                    <p className="text-sm text-gray-300 font-medium">Historical price data</p>
                  </div>
                  <span className="bg-gradient-to-r from-black/80 to-gray-900/80 text-gray-200 text-sm px-4 py-2 rounded-xl border border-gray-400/50 backdrop-blur-sm shadow-lg">
                    {Object.keys(roundHistory).length} {Object.keys(roundHistory).length === 1 ? 'Round' : 'Rounds'}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar rounded-xl">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-800/90 via-gray-700/80 to-gray-800/90 border-b border-gray-600/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Round</th>
                      {stockList.map((s) => (
                        <th key={s} className="px-6 py-4 text-right text-sm font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600/30">
                    {Object.entries(roundHistory)
                      .sort()
                      .map(([roundKey, data]) => (
                        <tr key={roundKey} className="hover:bg-gradient-to-r hover:from-gray-700/50 hover:via-gray-600/40 hover:to-gray-700/50 transition-all duration-300">
                          <td className="px-6 py-4 font-bold text-gray-100 text-base">
                            {roundKey.replace("round", "Round ")}
                          </td>
                          {stockList.map((stock) => (
                            <td key={stock} className="px-6 py-4 text-right font-mono text-gray-200 text-sm font-medium">
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