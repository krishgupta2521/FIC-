"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  Activity,
  Filter,
  Calendar,
  DollarSign,
  PieChart,
  Target,
  ArrowLeft,
  Download,
  Search,
  Wallet
} from 'lucide-react';
import Link from 'next/link';

export default function TradeHistory() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ cash: 100000, holdings: {}, name: "Player" });
  const [tradeHistory, setTradeHistory] = useState([]);
  const [roundPnL, setRoundPnL] = useState({});
  const [stocks, setStocks] = useState({});
  const [roundHistory, setRoundHistory] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedRound, setSelectedRound] = useState("all");
  const [selectedStock, setSelectedStock] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Navigation transition states
  const [isNavigating, setIsNavigating] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);

  // Auth listener
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

  // Data listeners
  useEffect(() => {
    if (!user) return;
    
    const userRef = ref(db, `users/${user.uid}`);
    const histRef = ref(db, `tradeHistory/${user.uid}`);
    const pnlRef = ref(db, `roundPnL/${user.uid}`);
    const stocksRef = ref(db, "stocks");
    const roundHistoryRef = ref(db, "roundHistory");
    
    const unsubscribeUser = onValue(userRef, (snap) => {
      const data = snap.val();
      if (data) {
        setUserData({ ...data, name: data.name || user.email?.split("@")[0] || "Player" });
      }
    });
    
    const unsubscribeHist = onValue(histRef, (snap) => {
      const data = snap.val();
      if (data) {
        const trades = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setTradeHistory(trades);
      } else {
        setTradeHistory([]);
      }
      setLoading(false);
    });
    
    const unsubscribePnL = onValue(pnlRef, (snap) => {
      setRoundPnL(snap.val() || {});
    });
    
    const unsubscribeStocks = onValue(stocksRef, (snap) => {
      if (snap.exists()) setStocks(snap.val());
    });
    
    const unsubscribeRoundHistory = onValue(roundHistoryRef, (snap) => {
      setRoundHistory(snap.val() || {});
    });
    
    return () => {
      unsubscribeUser();
      unsubscribeHist();
      unsubscribePnL();
      unsubscribeStocks();
      unsubscribeRoundHistory();
    };
  }, [user]);

  // Calculate statistics
  const calculateStats = () => {
    const filteredTrades = getFilteredTrades();
    
    const totalTrades = filteredTrades.length;
    const buyTrades = filteredTrades.filter(t => t.type === "BUY").length;
    const sellTrades = filteredTrades.filter(t => t.type === "SELL").length;
    
    const totalVolume = filteredTrades.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalCashFlow = filteredTrades.reduce((sum, t) => sum + (t.cashChange || 0), 0);
    
    // Calculate P&L by round
    const roundPnLData = {};
    const rounds = [...new Set(filteredTrades.map(t => t.round))].filter(Boolean).sort();
    
    rounds.forEach(round => {
      const roundTrades = filteredTrades.filter(t => t.round === round);
      const roundCashFlow = roundTrades.reduce((sum, t) => sum + (t.cashChange || 0), 0);
      roundPnLData[round] = roundCashFlow;
    });
    
    return {
      totalTrades,
      buyTrades,
      sellTrades,
      totalVolume,
      totalCashFlow,
      roundPnLData,
      rounds
    };
  };

  const getFilteredTrades = () => {
    return tradeHistory.filter(trade => {
      const roundMatch = selectedRound === "all" || trade.round === parseInt(selectedRound);
      const stockMatch = selectedStock === "all" || trade.symbol === selectedStock;
      const typeMatch = selectedType === "all" || trade.type === selectedType;
      const searchMatch = searchQuery === "" || 
        trade.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.type?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return roundMatch && stockMatch && typeMatch && searchMatch;
    });
  };

  const getUniqueValues = (field) => {
    return [...new Set(tradeHistory.map(t => t[field]).filter(Boolean))].sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141519] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-100 mb-2">Loading Trade History</h2>
          <p className="text-gray-400">Please wait while we fetch your trading data...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const filteredTrades = getFilteredTrades();

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
      
      <div className="min-h-screen bg-[#141519]">
        {/* Header */}
        <header className="bg-[#1a1d23] border-b border-gray-700 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-8">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsNavigating(true);
                    setPageTransition(true);
                    setTimeout(() => {
                      window.location.href = '/dashboard';
                    }, 600);
                  }}
                  disabled={isNavigating}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-all duration-300 px-3 py-2 rounded-lg hover:bg-gray-700/50 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isNavigating ? (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowLeft size={20} />
                  )}
                  <span className="font-medium">{isNavigating ? 'Loading...' : 'Back to Dashboard'}</span>
                </button>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-100">Trade History & Analytics</h1>
                    <p className="text-sm text-gray-400 -mt-0.5">Comprehensive Trading Records</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-600">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {userData.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-gray-100 font-medium">{userData.name}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1a1d23] rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity size={20} className="text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{stats.totalTrades}</p>
                <p className="text-sm text-gray-400">Total Trades</p>
                <div className="flex space-x-4 text-xs">
                  <span className="text-green-400">{stats.buyTrades} Buys</span>
                  <span className="text-red-400">{stats.sellTrades} Sells</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1d23] rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">₹{stats.totalVolume.toLocaleString("en-IN")}</p>
                <p className="text-sm text-gray-400">Total Volume</p>
              </div>
            </div>

            <div className="bg-[#1a1d23] rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stats.totalCashFlow >= 0 ? "bg-green-600" : "bg-red-600"
                }`}>
                  {stats.totalCashFlow >= 0 ? (
                    <TrendingUp size={20} className="text-white" />
                  ) : (
                    <TrendingDown size={20} className="text-white" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${
                  stats.totalCashFlow >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {stats.totalCashFlow >= 0 ? "+" : ""}₹{stats.totalCashFlow.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-gray-400">Net P&L</p>
              </div>
            </div>

            <div className="bg-[#1a1d23] rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{stats.rounds.length}</p>
                <p className="text-sm text-gray-400">Rounds Played</p>
              </div>
            </div>
          </div>

          {/* Round P&L Summary */}
          {stats.rounds.length > 0 && (
            <div className="bg-[#1a1d23] rounded-xl border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <PieChart size={16} className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-100">Round-wise Profit & Loss</h2>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {stats.rounds.map(round => {
                    const pnl = stats.roundPnLData[round] || 0;
                    return (
                      <div key={round} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Round {round}</span>
                          <div className={`w-3 h-3 rounded-full ${
                            pnl > 0 ? "bg-green-500" : pnl < 0 ? "bg-red-500" : "bg-gray-500"
                          }`}></div>
                        </div>
                        <p className={`text-lg font-bold ${
                          pnl > 0 ? "text-green-400" : pnl < 0 ? "text-red-400" : "text-gray-400"
                        }`}>
                          {pnl > 0 ? "+" : ""}₹{pnl.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tradeHistory.filter(t => t.round === round).length} trades
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-[#1a1d23] rounded-xl border border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <Filter size={16} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-100">Filter Trades</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Search</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search symbol or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Round</label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg text-white focus:outline-none text-sm transition-colors"
                >
                  <option value="all">All Rounds</option>
                  {getUniqueValues('round').map(round => (
                    <option key={round} value={round}>Round {round}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Stock</label>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg text-white focus:outline-none text-sm transition-colors"
                >
                  <option value="all">All Stocks</option>
                  {getUniqueValues('symbol').map(stock => (
                    <option key={stock} value={stock}>{stock}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg text-white focus:outline-none text-sm transition-colors"
                >
                  <option value="all">All Types</option>
                  <option value="BUY">Buy Orders</option>
                  <option value="SELL">Sell Orders</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Actions</label>
                <button
                  onClick={() => {
                    setSelectedRound("all");
                    setSelectedStock("all");
                    setSelectedType("all");
                    setSearchQuery("");
                  }}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Trade History Table */}
          <div className="bg-[#1a1d23] rounded-xl border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
                    <Activity size={16} className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-100">Trade Records</h2>
                  <span className="bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded border border-gray-600">
                    {filteredTrades.length} {filteredTrades.length === 1 ? 'Trade' : 'Trades'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              {filteredTrades.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Activity size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-400">No trades found matching your filters</p>
                  <p className="text-gray-500 text-sm mt-2">Try adjusting your filter criteria</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-100">Date & Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-100">Round</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-100">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-100">Symbol</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-100">Quantity</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-100">Price</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-100">Total</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-100">P&L Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredTrades.map((trade, index) => (
                      <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {trade.timestamp ? new Date(trade.timestamp).toLocaleString() : "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                            Round {trade.round || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            trade.type === "BUY" 
                              ? "bg-green-900 text-green-300" 
                              : "bg-red-900 text-red-300"
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-100">
                          {trade.symbol}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-300">
                          {trade.quantity?.toLocaleString("en-IN") || 0}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-300">
                          ₹{Number(trade.price || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-100">
                          ₹{Number(trade.total || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono font-medium ${
                            (trade.cashChange || 0) >= 0 ? "text-green-400" : "text-red-400"
                          }`}>
                            {(trade.cashChange || 0) >= 0 ? "+" : ""}₹{Number(trade.cashChange || 0).toLocaleString("en-IN")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Page Transition Overlay */}
      {pageTransition && (
        <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center transition-all duration-600">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg font-medium">Returning to Dashboard...</p>
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