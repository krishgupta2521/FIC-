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
  Settings,
  Plus,
  Minus,
  RefreshCw,
  Star,
  Filter
} from 'lucide-react';

export default function Dashboard() {
  const [stocks, setStocks] = useState({});
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ cash: 100000, holdings: {}, name: "Player" });
  const [selectedStock, setSelectedStock] = useState("");
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-100 border-t-green-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Market Data</h2>
          <p className="text-gray-600">Please wait while we fetch the latest prices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Groww-style Header */}
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">FIC Exchange</h1>
                  <p className="text-xs text-gray-500 -mt-0.5">Live Trading Platform</p>
                </div>
              </div>
              
              {/* Market Status Indicator */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isFrozen || timerData?.isPaused ? "bg-red-500" : "bg-green-500"
                }`}></div>
                <span className={`text-xs font-medium ${
                  isFrozen || timerData?.isPaused ? "text-red-700" : "text-green-700"
                }`}>
                  {isFrozen ? "Frozen" : timerData?.isPaused ? "Paused" : "Live"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* User Info Card */}
              <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {userData.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900">{userData.name}</span>
                  <p className="text-xs text-gray-500 -mt-0.5">Trader</p>
                </div>
              </div>
              
              {/* Logout Button */}
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
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 hover:border-red-200 transition-all"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Portfolio Summary - Groww Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Wallet size={20} className="text-green-600" />
                <span className="text-sm font-medium text-gray-600">Portfolio Value</span>
              </div>
              <RefreshCw size={16} className="text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">₹{portfolioValue.toLocaleString("en-IN")}</p>
              <p className="text-sm text-gray-500">Available: ₹{userData.cash?.toLocaleString("en-IN") || '0'}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Timer size={20} className={timerData?.isRunning && !timerData?.isPaused ? "text-green-600" : "text-red-500"} />
                <span className="text-sm font-medium text-gray-600">Round {round}</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                isFrozen || timerData?.isPaused ? "bg-red-500" : "bg-green-500"
              } animate-pulse`}></div>
            </div>
            <div className="space-y-1">
              <p className={`text-2xl font-bold font-mono ${
                timerData?.isRunning && !timerData?.isPaused ? "text-green-600" : "text-red-500"
              }`}>{displayTime}</p>
              <p className={`text-sm ${
                isFrozen || timerData?.isPaused ? "text-red-500" : "text-green-600"
              }`}>
                {isFrozen ? "Market Frozen" : timerData?.isPaused ? "Market Paused" : "Live Trading"}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 size={20} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Holdings</span>
              </div>
              <span className="text-xs text-gray-400">{Object.keys(userData.holdings || {}).length} stocks</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{Object.keys(userData.holdings || {}).length}</p>
              <p className="text-sm text-gray-500">Active positions</p>
            </div>
          </div>
        </div>

        {/* Market News - Groww Style */}
        {liveNews.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} className="text-orange-600" />
                <span className="text-lg font-semibold text-gray-900">Market Updates</span>
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                  {liveNews.length} {liveNews.length === 1 ? 'Update' : 'Updates'}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
              {liveNews.slice(0, 5).map((news, index) => (
                <div key={news.id || index} className={`p-3 rounded-lg border-l-4 ${
                  news.severity === 'severe' ? 'bg-red-50 border-red-400' :
                  news.severity === 'moderate' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold uppercase ${
                      news.severity === 'severe' ? 'text-red-700' :
                      news.severity === 'moderate' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {news.severity || 'Breaking'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {news.newsTriggerTime ? new Date(news.newsTriggerTime).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    news.severity === 'severe' ? 'text-red-800' :
                    news.severity === 'moderate' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {news.text}
                  </p>
                  {news.priceTriggered && news.stocks && Object.keys(news.stocks).filter(s => news.stocks[s]).length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-600">Affected stocks: </span>
                      <span className="text-xs font-medium text-gray-700">
                        {Object.keys(news.stocks).filter(s => news.stocks[s]).join(', ')}
                      </span>
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

        {/* Market Dynamics Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Market Dynamics</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stocks).slice(0, 6).map(([symbol, data]) => {
                const symbolOrderBook = orderBook[symbol] || { buyers: 0, sellers: 0, volume: 0 };
                const buyPressure = symbolOrderBook.buyers || 0;
                const sellPressure = symbolOrderBook.sellers || 0;
                const totalPressure = buyPressure + sellPressure;
                const buyPercentage = totalPressure > 0 ? (buyPressure / totalPressure) * 100 : 50;
                const trend = buyPercentage > 60 ? "up" : buyPercentage < 40 ? "down" : "neutral";
                
                return (
                  <div key={symbol} className={`p-3 rounded-lg border-2 ${
                    trend === "up" ? "bg-green-50 border-green-200" :
                    trend === "down" ? "bg-red-50 border-red-200" :
                    "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900">{symbol}</span>
                      <div className="flex items-center space-x-1">
                        {trend === "up" ? (
                          <TrendingUp size={16} className="text-green-600" />
                        ) : trend === "down" ? (
                          <TrendingDown size={16} className="text-red-600" />
                        ) : (
                          <Activity size={16} className="text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-900">₹{Number(data.price).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Pressure Bar */}
                    <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${buyPercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
                      <div className="text-center">
                        <div className="font-medium text-green-600">{buyPressure}</div>
                        <div>Buyers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{symbolOrderBook.volume || 0}</div>
                        <div>Volume</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{sellPressure}</div>
                        <div>Sellers</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Trading Interface - Groww Style */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stock List - Groww Style */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Market</h2>
                  <div className="flex items-center space-x-2">
                    <Search size={16} className="text-gray-400" />
                    <Filter size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
                {Object.entries(stocks).map(([sym, data]) => {
                  const price = Number(data.price);
                  const prevPrice = price * (1 + (Math.random() - 0.5) * 0.02); // Mock previous price for demo
                  const change = price - prevPrice;
                  const changePercent = (change / prevPrice) * 100;
                  const isPositive = change >= 0;
                  
                  return (
                    <div
                      key={sym}
                      onClick={() => setSelectedStock(sym)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedStock === sym
                          ? "bg-green-50 border-green-200"
                          : "hover:bg-gray-50 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{sym}</span>
                            {selectedStock === sym && <Star size={14} className="text-green-500 fill-current" />}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-lg font-semibold text-gray-900">₹{price.toFixed(2)}</span>
                            <div className={`flex items-center space-x-1 text-xs font-medium ${
                              isPositive ? "text-green-600" : "text-red-600"
                            }`}>
                              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              <span>{isPositive ? "+" : ""}{changePercent.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {isPositive ? "+" : ""}₹{Math.abs(change).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Trading Panel - Groww Style */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedStock ? `Trade ${selectedStock}` : "Select a Stock"}
                </h2>
              </div>
              <div className="p-6">
                {selectedStock && stocks[selectedStock] ? (
                  <div className="space-y-6">
                    {/* Stock Info */}
                    <div className="text-center py-4">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedStock}</h3>
                      <p className="text-3xl font-bold text-green-600">₹{Number(stocks[selectedStock].price).toFixed(2)}</p>
                    </div>

                    {/* Quantity Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        placeholder="Enter quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none text-center text-lg font-semibold"
                      />
                    </div>

                    {/* Available Cash & Order Value */}
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-blue-700">Available Cash</span>
                          <span className="font-bold text-blue-900">
                            ₹{userData.cash?.toLocaleString("en-IN") || '0'}
                          </span>
                        </div>
                      </div>
                      
                      {quantity && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Order Value</span>
                            <span className="font-semibold text-gray-900">
                              ₹{(Number(quantity) * Number(stocks[selectedStock].price)).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Remaining Cash</span>
                            <span className={`text-xs font-medium ${
                              (userData.cash || 0) - (Number(quantity) * Number(stocks[selectedStock].price)) >= 0 
                                ? "text-green-600" : "text-red-600"
                            }`}>
                              ₹{((userData.cash || 0) - (Number(quantity) * Number(stocks[selectedStock].price))).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trade Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleTrade("BUY")}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Plus size={18} />
                        <span>BUY</span>
                      </button>
                      <button
                        onClick={() => handleTrade("SELL")}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Minus size={18} />
                        <span>SELL</span>
                      </button>
                    </div>

                    {/* Message */}
                    {message && (
                      <div className={`p-4 rounded-lg border ${
                        message.includes("BOUGHT") || message.includes("SOLD")
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}>
                        <p className="text-center font-medium">{message}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a stock from the list to start trading</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trade History - Groww Style */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Trades</h2>
              </div>
              <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                {tradeHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No trades yet</p>
                  </div>
                ) : (
                  tradeHistory.slice(0, 10).map((t, i) => {
                    const avgPrice = t.quantity > 0 ? (Math.abs(t.cashChange) / t.quantity) : 0;
                    return (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            t.type === "BUY" ? "bg-green-500" : "bg-red-500"
                          }`}></div>
                          <span className="text-sm font-semibold text-gray-900">{t.type}</span>
                          <span className="text-sm text-gray-600">{t.symbol}</span>
                        </div>
                        <span className="text-xs text-gray-500">R{t.round}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{t.quantity} shares</span>
                        <span className={`text-sm font-semibold ${
                          t.type === "BUY" ? "text-red-600" : "text-green-600"
                        }`}>
                          {t.cashChange > 0 ? "+" : ""}₹{Math.abs(t.cashChange).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Avg: ₹{avgPrice.toFixed(2)}/share</span>
                        <span className="text-xs text-gray-400">
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

        {/* Holdings Section - Groww Style */}
        {Object.keys(userData.holdings || {}).length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Holdings</h2>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(userData.holdings || {}).map(([sym, qty]) => {
                  const currentPrice = Number(stocks[sym]?.price || 0);
                  const holdingValue = currentPrice * qty;
                  
                  return (
                    <div key={sym} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{sym}</span>
                          <span className="text-sm text-gray-500">{qty} shares</span>
                        </div>
                        <div className="text-sm text-gray-600">₹{currentPrice.toFixed(2)} per share</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">₹{holdingValue.toLocaleString("en-IN")}</div>
                        <div className="text-sm text-green-600">Current Value</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Round History - Groww Style */}
        {Object.keys(roundHistory).length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Round History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Round</th>
                      {stockList.map((s) => (
                        <th key={s} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(roundHistory)
                      .sort()
                      .map(([roundKey, data]) => (
                        <tr key={roundKey} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {roundKey.replace("round", "Round ").toUpperCase()}
                          </td>
                          {stockList.map((stock) => (
                            <td key={stock} className="px-4 py-3 text-right font-mono text-gray-700">
                              ₹{data.prices?.[stock]?.toFixed(2) || "-"}
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
  );
}