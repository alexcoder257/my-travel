"use client";

import Link from "next/link";
import { MapPin, CheckSquare, DollarSign, Home } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg">Travel Tracker</span>
          </Link>

          <div className="flex gap-1 sm:gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/itinerary"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Itinerary</span>
            </Link>
            <Link
              href="/checklist"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Checklist</span>
            </Link>
            <Link
              href="/expenses"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Expenses</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
