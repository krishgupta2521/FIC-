// app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, set, runTransaction } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
// import confetti from "canvas-confetti"; // optional, uncomment if you want confetti

export default function Dashboard() {
  const [stocks, setStocks] = useState({});
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ cash: 100000, holdings: {}, name: "Player" });
  const [selectedStock, setSelectedStock] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);

  // NEW: live news, freeze state, and round
  const [liveNews, setLiveNews] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [round, setRound] = useState(1);

  // Timer (client-side UI countdown; keep server-timed for game logic)
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => (t <= 0 ? 600 : t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Auth listener with unsubscribe
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  // Load user data and ensure user doc exists
  useEffect(() => {
    if (!user) return;
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(
      userRef,
      (snap) => {
        const data = snap.val();
        if (data) {
          setUserData({ ...data, name: data.name || user.email?.split("@")[0] || "Player" });
        } else {
          // Defensive: create base user doc
          set(userRef, { cash: 100000, holdings: {}, name: user.email?.split("@")[0] || "Player" }).catch((err) => {
            console.error("Error creating user doc:", err);
          });
        }
      },
      (err) => {
        console.error("User data listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Load stocks
  useEffect(() => {
    const stocksRef = ref(db, "stocks");
    const unsubscribe = onValue(
      stocksRef,
      (snap) => {
        const data = snap.val();
        if (data) setStocks(data);
      },
      (err) => {
        console.error("Stocks listener error:", err);
      }
    );
    return () => unsubscribe();
  }, []);

  // LIVE NEWS TICKER — FIXED TO READ NEW FORMAT (REPLACED)
  useEffect(() => {
    const newsRef = ref(db, "liveNews");
    const unsub = onValue(newsRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setLiveNews([]);
        return;
      }

      const newsArray = Object.values(data)
        .filter((n) => n.newsTriggered === true) // ← ONLY SHOW WHEN NEWS IS TRIGGERED
        .sort((a, b) => (b.newsTriggerTime || b.timestamp || 0) - (a.newsTriggerTime || a.timestamp || 0));

      setLiveNews(newsArray);
    });

    return () => unsub();
  }, []);

  // Keep frozen and round listeners in their own effect
  useEffect(() => {
    const frozenRef = ref(db, "game/frozen");
    const roundRef = ref(db, "round/current");

    const unsubFrozen = onValue(frozenRef, (snap) => {
      setIsFrozen(snap.val() === true);
    }, (err) => console.error("frozen listener error:", err));

    const unsubRound = onValue(roundRef, (snap) => {
      setRound(snap.val() || 1);
    }, (err) => console.error("round listener error:", err));

    return () => {
      unsubFrozen();
      unsubRound();
    };
  }, []);

  // Prepare ticker text
  const latestNews = liveNews[0];
  const newsText = latestNews
    ? `${latestNews.severity?.toUpperCase() || "BREAKING"}: ${latestNews.text}`
    : "Market stable • Waiting for next event...";

  const portfolioValue =
    (userData?.cash || 0) +
    Object.entries(userData.holdings || {}).reduce((acc, [sym, qty]) => {
      const price = Number(stocks[sym]?.price || 0);
      return acc + price * qty;
    }, 0);

  // Robust, atomic trade handler (BUY / SELL)
  const handleTrade = async (type) => {
    setMessage("");

    // NEW: respect admin freeze
    if (isFrozen) {
      setMessage("TRADING IS FROZEN BY ADMIN");
      return;
    }

    try {
      // Basic guards
      if (!user || !user.uid) {
        setMessage("Not signed in");
        return;
      }
      if (!selectedStock) {
        setMessage("Select a stock first");
        return;
      }

      // Ensure stock exists and price is numeric
      const priceRaw = stocks[selectedStock]?.price;
      const currentPrice = Number(priceRaw);
      console.log("handleTrade attempt", { type, selectedStock, quantity, currentPrice });

      if (!priceRaw || Number.isNaN(currentPrice)) {
        setMessage("Stock not loaded yet. Wait...");
        return;
      }

      // Normalize quantity
      const qty = Math.floor(Number(quantity));
      if (!qty || qty < 1) {
        setMessage("Enter a valid quantity (>= 1)");
        return;
      }

      const total = currentPrice * qty;
      const userRef = ref(db, `users/${user.uid}`);

      // Use transaction to avoid race conditions
      await runTransaction(userRef, (current) => {
        if (current === null) {
          // Defensive default
          current = { cash: 100000, holdings: {}, name: user.email?.split("@")[0] || "Player" };
        }

        const holdings = { ...(current.holdings || {}) };
        const owned = Number(holdings[selectedStock] || 0);

        if (type === "BUY") {
          if ((Number(current.cash) || 0) < total) {
            // Abort transaction by throwing a special error
            throw new Error("NOT_ENOUGH_CASH");
          }
          holdings[selectedStock] = owned + qty;
          current.cash = (Number(current.cash) || 0) - total;
        } else {
          // SELL
          if ((owned || 0) < qty) {
            throw new Error("NOT_ENOUGH_SHARES");
          }
          const newQty = owned - qty;
          if (newQty <= 0) delete holdings[selectedStock];
          else holdings[selectedStock] = newQty;
          current.cash = (Number(current.cash) || 0) + total;
        }

        current.holdings = holdings;
        return current;
      });

      // If transaction succeeded
      setMessage(`${type === "BUY" ? "BOUGHT" : "SOLD"} ${Math.floor(Number(quantity))} × ${selectedStock} @ ₹${currentPrice.toFixed(2)}`);
      setQuantity("");
      // Optional celebration:
      // confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });

    } catch (err) {
      console.error("Trade transaction error:", err);
      if (err?.message === "NOT_ENOUGH_CASH") setMessage("Not enough cash!");
      else if (err?.message === "NOT_ENOUGH_SHARES") setMessage("Not enough shares!");
      else setMessage("Trade failed — check console");
    }
  };

  // Keep the old handleTrade-button wiring but map it to the new handler
  const handleBuy = () => handleTrade("BUY");
  const handleSell = () => handleTrade("SELL");

  if (!user || Object.keys(stocks).length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-6xl font-bold">
        Loading Market...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-6xl font-bold">FIC Stock Exchange</h1>

          <div className="text-right">
            <p className="text-3xl font-bold text-[#C0C0C0] mb-4">{userData.name}</p>
            <button
              onClick={() => signOut(auth)}
              className="bg-red-600 hover:bg-red-500 px-10 py-5 rounded-2xl text-2xl font-bold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* NEW: Marquee / Ticker */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-7xl font-bold text-red-500">{formatTime(timeLeft)}</div>
              <p className="text-4xl font-bold text-purple-400 mt-4">ROUND {round} • LIVE</p>
            </div>

            <div className="w-1/2">
              <div className="bg-gradient-to-r from-red-700 via-orange-600 to-red-700 py-5 overflow-hidden border-y-4 border-red-500 shadow-2xl rounded-xl">
                <div className="animate-marquee whitespace-nowrap text-3xl md:text-5xl font-black tracking-wider">
                  <span className="mx-16">{newsText}</span>
                  <span className="mx-16">{newsText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Market */}
          <div>
            <h2 className="text-5xl font-bold mb-10 text-[#C0C0C0]">Live Market</h2>
            <div className="space-y-8">
              {Object.entries(stocks).map(([sym, data]) => (
                <div
                  key={sym}
                  onClick={() => setSelectedStock(sym)}
                  className={`p-10 rounded-3xl text-center cursor-pointer transition-all border-4 ${
                    selectedStock === sym
                      ? "bg-white text-black border-white shadow-2xl scale-105"
                      : "bg-[#111] border-gray-700 hover:border-gray-500"
                  }`}
                >
                  <div className="text-4xl font-bold">{sym}</div>
                  <div className="text-6xl font-bold mt-6">₹{Number(data.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trade */}
          <div className="bg-[#111] rounded-3xl p-16 border-4 border-gray-700">
            <h2 className="text-6xl font-bold text-center mb-16 text-[#C0C0C0]">TRADE</h2>

            {selectedStock && stocks[selectedStock] ? (
              <>
                <h3 className="text-7xl font-bold text-center mb-10">{selectedStock}</h3>
                <p className="text-8xl font-bold text-center text-green-400 mb-16">
                  ₹{Number(stocks[selectedStock].price).toFixed(2)}
                </p>

                <input
                  type="number"
                  placeholder="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-10 text-5xl text-center bg-black rounded-3xl mb-16 border-4 border-gray-600"
                />

                <div className="grid grid-cols-2 gap-12">
                  <button
                    onClick={handleBuy}
                    className="bg-green-600 hover:bg-green-500 py-16 rounded-3xl text-6xl font-bold shadow-2xl"
                  >
                    BUY
                  </button>
                  <button
                    onClick={handleSell}
                    className="bg-red-600 hover:bg-red-500 py-16 rounded-3xl text-6xl font-bold shadow-2xl"
                  >
                    SELL
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-5xl text-gray-500 py-40">Click a stock to trade</p>
            )}

            {message && (
              <p
                className={`text-center text-6xl font-bold mt-20 ${
                  message.includes("BOUGHT") || message.includes("SOLD") ? "text-green-400" : "text-red-400"
                }`}
              >
                {message}
              </p>
            )}
          </div>

          {/* Portfolio */}
          <div>
            <h2 className="text-5xl font-bold mb-10 text-[#C0C0C0]">Your Portfolio</h2>
            <div className="bg-gradient-to-br from-purple-900 to-black rounded-3xl p-16 text-center border-4 border-purple-700 mb-12">
              <p className="text-9xl font-bold">₹{portfolioValue.toLocaleString("en-IN")}</p>
              <p className="text-4xl text-gray-300 mt-8">Total Value</p>
            </div>

            <div className="bg-[#111] rounded-3xl p-10 border-4 border-gray-700">
              <p className="text-3xl font-bold mb-8">Holdings</p>
              {Object.keys(userData.holdings || {}).length === 0 ? (
                <p className="text-center text-2xl text-gray-500">No stocks yet</p>
              ) : (
                <div className="space-y-8">
                  {Object.entries(userData.holdings).map(([sym, qty]) => (
                    <div key={sym} className="flex justify-between text-3xl font-bold">
                      <span>{sym}</span>
                      <span>{qty} shares</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
