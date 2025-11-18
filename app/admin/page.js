// app/admin/page.js — FIXED VERSION (No More Loading Loop)
"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [error, setError] = useState("");
  const [adminEmail, setAdminEmail] = useState(""); // For manual login
  const [adminPassword, setAdminPassword] = useState("");

  // ←←← YOUR ADMIN EMAIL ←←←
  const ADMIN_EMAIL = "alokpandey4482@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("Auth state:", u?.email); // Debug in console
      if (u && u.email === ADMIN_EMAIL) {
        setUser(u);
        setLoading(false);
        setError("");
      } else {
        setUser(null);
        setLoading(false);
        setError("Not admin. Login with: " + ADMIN_EMAIL);
      }
    });
    return unsub;
  }, []);

  const manualLogin = async () => {
    if (!adminEmail || !adminPassword) return setError("Enter email/password");
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      setError("");
    } catch (err) {
      setError("Login failed: " + err.message);
    }
  };

  const publishNews = async () => {
    if (!news.trim()) return setError("Write news first!");
    setError("");

    try {
      await push(ref(db, "news"), {
        text: news,
        severity,
        timestamp: Date.now(),
      });

      // Shake prices
      const impact = { mild: 0.03, moderate: 0.06, severe: 0.12 }[severity];
      const direction = Math.random() > 0.5 ? 1 : -1;
      const stocksSnap = await ref(db, "stocks").get();
      stocksSnap.forEach((child) => {
        const oldPrice = child.val().price;
        const change = 1 + (impact * direction * (0.5 + Math.random()));
        child.ref.update({ price: oldPrice * change });
      });

      setNews("");
      setError("SUCCESS! News published — market shook!");
    } catch (err) {
      setError("Publish failed: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-6xl font-bold">Loading Admin...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-9xl font-black mb-10 bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
            ADMIN LOGIN
          </h1>
          <p className="text-4xl mb-8 text-red-400">{error}</p>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Admin Email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full p-6 text-3xl bg-white/10 rounded-3xl border-4 border-purple-600"
            />
            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full p-6 text-3xl bg-white/10 rounded-3xl border-4 border-purple-600"
            />
            <button
              onClick={manualLogin}
              className="w-full py-12 text-6xl font-black bg-gradient-to-r from-red-600 to-purple-800 rounded-3xl hover:scale-105 transition"
            >
              LOGIN AS ADMIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-9xl font-black mb-10 bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
          ADMIN PANEL
        </h1>
        <p className="text-4xl mb-8 text-cyan-400">Logged in as: <span className="font-bold">{user.email}</span></p>

        <textarea
          value={news}
          onChange={(e) => setNews(e.target.value)}
          placeholder="Type breaking news (e.g., 'RBI cuts rates by 50bps!')..."
          className="w-full p-10 text-3xl bg-white/10 rounded-3xl border-4 border-purple-600 focus:border-cyan-400 outline-none mb-8"
          rows={6}
        />

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="w-full p-8 text-3xl bg-white/10 rounded-3xl border-4 border-purple-600 mb-8"
        >
          <option value="mild">Mild Impact (+/- 3%)</option>
          <option value="moderate">Moderate Impact (+/- 6%)</option>
          <option value="severe">Severe Impact (+/- 12%)</option>
        </select>

        <button
          onClick={publishNews}
          className="w-full py-16 text-6xl font-black bg-gradient-to-r from-red-600 to-purple-800 rounded-3xl hover:scale-105 transition mb-8 shadow-2xl"
        >
          PUBLISH NEWS & SHAKE MARKET
        </button>

        <button
          onClick={() => signOut(auth).then(() => location.href = "/")}
          className="px-20 py-8 bg-red-600 rounded-2xl text-4xl font-bold hover:bg-red-700 transition"
        >
          Logout
        </button>

        {error && (
          <div className="mt-8 p-6 bg-red-600/20 border-2 border-red-500 rounded-3xl text-red-300 text-2xl">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}