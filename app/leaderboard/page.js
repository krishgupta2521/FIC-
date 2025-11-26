"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { 
  Trophy, 
  Medal, 
  Award,
  TrendingUp, 
  TrendingDown,
  Users,
  Crown,
  Star,
  ArrowLeft,
  BarChart3,
  Zap,
  Target,
  Flame,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';
import Link from 'next/link';

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState({});
  const [stocks, setStocks] = useState({});
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roundData, setRoundData] = useState({ round: 1, isActive: false });
  
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
    const usersRef = ref(db, "users");
    const stocksRef = ref(db, "stocks");
    const timerRef = ref(db, "roundTimer/current");
    
    const unsubscribeUsers = onValue(usersRef, (snap) => {
      setAllUsers(snap.val() || {});
    });
    
    const unsubscribeStocks = onValue(stocksRef, (snap) => {
      if (snap.exists()) {
        setStocks(snap.val());
      }
    });

    const unsubscribeTimer = onValue(timerRef, (snap) => {
      const data = snap.val();
      setRoundData({
        round: data?.roundNumber || 1,
        isActive: data?.isRunning || false
      });
    });
    
    return () => {
      unsubscribeUsers();
      unsubscribeStocks();
      unsubscribeTimer();
    };
  }, []);

  // Calculate leaderboard
  useEffect(() => {
    if (Object.keys(allUsers).length === 0 || Object.keys(stocks).length === 0) {
      return;
    }

    const leaderboard = Object.entries(allUsers).map(([userId, userData]) => {
      const cash = userData.cash || 0;
      const holdings = userData.holdings || {};
      
      // Calculate portfolio value
      const holdingsValue = Object.entries(holdings).reduce((total, [symbol, quantity]) => {
        const stockPrice = stocks[symbol]?.price || 0;
        return total + (stockPrice * quantity);
      }, 0);
      
      const portfolioValue = cash + holdingsValue;
      
      // Calculate total positions
      const totalPositions = Object.keys(holdings).length;
      
      // Calculate gain/loss from initial 100,000
      const gainLoss = portfolioValue - 100000;
      const gainLossPercentage = ((portfolioValue - 100000) / 100000) * 100;
      
      return {
        userId,
        name: userData.name || "Anonymous Player",
        portfolioValue,
        cash,
        totalPositions,
        gainLoss,
        gainLossPercentage,
        lastActive: userData.lastActive || Date.now()
      };
    }).sort((a, b) => b.portfolioValue - a.portfolioValue);

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((userEntry, index) => ({
      ...userEntry,
      rank: index + 1
    }));

    setLeaderboardData(rankedLeaderboard);
    setTotalUsers(rankedLeaderboard.length);
    
    // Find current user's rank
    if (user) {
      const currentUserEntry = rankedLeaderboard.find(entry => entry.userId === user.uid);
      setCurrentUserRank(currentUserEntry?.rank || null);
    }
    
    setLoading(false);
  }, [allUsers, stocks, user]);

  const getRankIcon = (rank) => {
    return <span className="text-lg font-bold text-white">#{rank}</span>;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500 to-yellow-600";
    if (rank === 2) return "bg-gradient-to-r from-gray-400 to-gray-500";
    if (rank === 3) return "bg-gradient-to-r from-orange-500 to-orange-600";
    if (rank <= 10) return "bg-gradient-to-r from-blue-500 to-blue-600";
    if (rank <= 25) return "bg-gradient-to-r from-green-500 to-green-600";
    return "bg-gradient-to-r from-gray-600 to-gray-700";
  };

  const getPerformanceTrend = (percentage) => {
    if (percentage > 5) return { icon: TrendingUp, color: "text-green-400", bg: "bg-green-900/30" };
    if (percentage < -5) return { icon: TrendingDown, color: "text-red-400", bg: "bg-red-900/30" };
    return { icon: Minus, color: "text-gray-400", bg: "bg-gray-800/30" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141519] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-100 mb-2">Loading Leaderboard</h2>
          <p className="text-gray-400">Calculating portfolio values...</p>
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
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          backdrop-filter: blur(8px);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(156, 163, 175, 0.8), rgba(107, 114, 128, 0.9));
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(156, 163, 175, 0.9), rgba(107, 114, 128, 1));
          box-shadow: 0 4px 8px rgba(255, 255, 255, 0.2);
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-[#0f1114] via-[#141519] to-[#1a1d23] relative overflow-hidden">
        {/* Premium Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/6 w-[400px] h-[400px] bg-gradient-to-r from-gray-500/10 via-white/5 to-gray-400/8 rounded-full blur-[80px] animate-pulse" style={{animationDuration: '8s'}} />
          <div className="absolute bottom-1/3 right-1/6 w-[350px] h-[350px] bg-gradient-to-l from-gray-600/8 via-white/3 to-gray-500/5 rounded-full blur-[70px] animate-pulse" style={{animationDuration: '12s', animationDelay: '2s'}} />
        </div>
        {/* Header */}
        <header className="bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl border-b border-gray-400/30 sticky top-0 z-50 shadow-2xl shadow-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-6">
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
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowLeft size={20} />
                  )}
                  <span className="font-medium">{isNavigating ? 'Loading...' : 'Back to Dashboard'}</span>
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 via-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <Trophy size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-100">Leaderboard</h1>
                    <p className="text-xs text-gray-400 -mt-0.5">Round {roundData.round} Rankings</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg border border-gray-600">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-gray-100 font-medium text-sm">{totalUsers} Players</span>
                </div>
                
                {currentUserRank && (
                  <div className="flex items-center space-x-2 bg-blue-900/30 px-3 py-2 rounded-lg border border-blue-600">
                    <Target size={16} className="text-blue-400" />
                    <span className="text-blue-100 font-medium text-sm">Your Rank: #{currentUserRank}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Top 3 Podium */}
          {leaderboardData.length >= 3 && (
            <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl border border-gray-400/30 shadow-2xl shadow-white/10 p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Flame size={24} className="text-orange-500" />
                  <h2 className="text-2xl font-bold text-gray-100">Top Performers</h2>
                  <Flame size={24} className="text-orange-500" />
                </div>
                <p className="text-gray-400">Leading traders in Round {roundData.round}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2nd Place */}
                <div className="order-1 md:order-1">
                  <div className="bg-gradient-to-br from-gray-700/80 via-gray-600/30 to-gray-800/80 backdrop-blur-md rounded-xl p-6 border-2 border-gray-500/60 shadow-2xl shadow-gray-400/20 text-center transform hover:scale-105 hover:shadow-gray-300/30 transition-all duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                        <Medal size={32} className="text-white" />
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-bold">#2</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{leaderboardData[1]?.name}</h3>
                    <p className="text-2xl font-bold text-white mb-1">₹{leaderboardData[1]?.portfolioValue.toLocaleString("en-IN")}</p>
                    <p className={`text-sm font-medium ${
                      leaderboardData[1]?.gainLoss >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {leaderboardData[1]?.gainLoss >= 0 ? "+" : ""}₹{leaderboardData[1]?.gainLoss.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="order-2 md:order-2">
                  <div className="bg-gradient-to-br from-yellow-600/90 via-yellow-500/40 to-yellow-700/90 backdrop-blur-md rounded-xl p-6 border-2 border-yellow-400/70 shadow-2xl shadow-yellow-500/40 text-center transform hover:scale-105 hover:shadow-yellow-400/50 transition-all duration-300 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-xs font-bold">
                        👑 CHAMPION
                      </div>
                    </div>
                    <div className="flex justify-center mb-4 mt-2">
                      <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                        <Crown size={40} className="text-yellow-900" />
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">#1</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{leaderboardData[0]?.name}</h3>
                    <p className="text-3xl font-bold text-white mb-1">₹{leaderboardData[0]?.portfolioValue.toLocaleString("en-IN")}</p>
                    <p className={`text-sm font-medium ${
                      leaderboardData[0]?.gainLoss >= 0 ? "text-yellow-200" : "text-red-300"
                    }`}>
                      {leaderboardData[0]?.gainLoss >= 0 ? "+" : ""}₹{leaderboardData[0]?.gainLoss.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 md:order-3">
                  <div className="bg-gradient-to-br from-orange-700/80 via-orange-600/30 to-orange-800/80 backdrop-blur-md rounded-xl p-6 border-2 border-orange-500/60 shadow-2xl shadow-orange-400/20 text-center transform hover:scale-105 hover:shadow-orange-300/30 transition-all duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <Award size={32} className="text-white" />
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">#3</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{leaderboardData[2]?.name}</h3>
                    <p className="text-2xl font-bold text-white mb-1">₹{leaderboardData[2]?.portfolioValue.toLocaleString("en-IN")}</p>
                    <p className={`text-sm font-medium ${
                      leaderboardData[2]?.gainLoss >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {leaderboardData[2]?.gainLoss >= 0 ? "+" : ""}₹{leaderboardData[2]?.gainLoss.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl border border-gray-400/30 shadow-2xl shadow-white/10">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 size={16} className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-100">Complete Rankings</h2>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Zap size={16} />
                  <span>Live Updates</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-800/60 via-gray-700/60 to-gray-800/60 border-b border-gray-600/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-100">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-100">Player</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-100">Portfolio Value</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-100">P&L</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-100">Performance</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-100">Positions</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-100">Cash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {leaderboardData.map((player, index) => {
                    const isCurrentUser = user && player.userId === user.uid;
                    const trend = getPerformanceTrend(player.gainLossPercentage);
                    const TrendIcon = trend.icon;
                    
                    return (
                      <tr 
                        key={player.userId} 
                        className={`hover:bg-gradient-to-r hover:from-gray-800/60 hover:via-gray-700/30 hover:to-gray-800/60 transition-all duration-300 border-b border-gray-600/30 ${
                          isCurrentUser ? "bg-gradient-to-r from-blue-900/30 via-blue-800/20 to-blue-900/30 border-l-4 border-l-blue-500/80" : ""
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getRankBadge(player.rank)}`}>
                              <span className="text-white font-bold text-sm">#{player.rank}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {player.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className={`font-medium ${isCurrentUser ? "text-blue-200" : "text-gray-100"}`}>
                                {player.name}
                                {isCurrentUser && (
                                  <span className="ml-2 bg-blue-600 text-white px-2 py-0.5 rounded text-xs">You</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400">
                                Active player
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-bold text-lg text-white">
                            ₹{player.portfolioValue.toLocaleString("en-IN")}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className={`font-medium ${
                            player.gainLoss >= 0 ? "text-green-400" : "text-red-400"
                          }`}>
                            {player.gainLoss >= 0 ? "+" : ""}₹{player.gainLoss.toLocaleString("en-IN")}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded ${trend.bg}`}>
                            <TrendIcon size={14} className={trend.color} />
                            <span className={`font-medium text-sm ${trend.color}`}>
                              {player.gainLossPercentage >= 0 ? "+" : ""}{player.gainLossPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                            {player.totalPositions}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-mono text-gray-300">
                            ₹{player.cash.toLocaleString("en-IN")}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-400/30 shadow-xl shadow-white/10 hover:shadow-white/20 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Crown size={20} className="text-white" />
                </div>
                <span className="text-gray-100 font-medium">Top Performer</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ₹{leaderboardData[0]?.portfolioValue.toLocaleString("en-IN") || "0"}
              </p>
              <p className="text-sm text-gray-400">
                {leaderboardData[0]?.name || "No players"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-400/30 shadow-xl shadow-white/10 hover:shadow-white/20 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Users size={20} className="text-white" />
                </div>
                <span className="text-gray-100 font-medium">Total Players</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalUsers}</p>
              <p className="text-sm text-gray-400">Active participants</p>
            </div>

            <div className="bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-400/30 shadow-xl shadow-white/10 hover:shadow-white/20 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <span className="text-gray-100 font-medium">Average Portfolio</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ₹{leaderboardData.length > 0 
                  ? Math.round(leaderboardData.reduce((sum, p) => sum + p.portfolioValue, 0) / leaderboardData.length).toLocaleString("en-IN")
                  : "0"
                }
              </p>
              <p className="text-sm text-gray-400">Market average</p>
            </div>

            <div className="bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-400/30 shadow-xl shadow-white/10 hover:shadow-white/20 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Flame size={20} className="text-white" />
                </div>
                <span className="text-gray-100 font-medium">Current Round</span>
              </div>
              <p className="text-2xl font-bold text-white">Round {roundData.round}</p>
              <p className={`text-sm ${roundData.isActive ? "text-green-400" : "text-gray-400"}`}>
                {roundData.isActive ? "Active" : "Paused"}
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Page Transition Overlay */}
      {pageTransition && (
        <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center transition-all duration-600">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg font-medium">Returning to Dashboard...</p>
            <div className="mt-3 flex space-x-1 justify-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}