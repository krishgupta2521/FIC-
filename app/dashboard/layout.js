// app/dashboard/layout.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for admin-created user first (localStorage)
    const checkAuth = () => {
      const adminUser = localStorage.getItem('adminCreatedUser');
      if (adminUser) {
        try {
          JSON.parse(adminUser); // Validate JSON
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('adminCreatedUser');
        }
      }
      
      // Then check Firebase auth
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setLoading(false);
        } else {
          // No auth found, redirect to login
          router.replace("/");
        }
      });
      
      return unsubscribe;
    };
    
    const unsubscribe = checkAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-100 border-t-green-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}