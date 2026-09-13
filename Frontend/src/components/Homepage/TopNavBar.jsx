// src/components/TopNavbar.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function TopNavbar({ isLoggedIn, user, onLogout }) {
  return (
    <nav className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      {/* LEFT SIDE BRAND LOGO + TITLE */}
      <div className="flex items-center gap-3">
        <div className="text-2xl font-extrabold text-indigo-600 tracking-wide">
          SMP
        </div>

        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-gray-800 leading-tight">
            Student Management Portal
          </h1>
          <p className="text-xs text-gray-500 -mt-1">Director Panel</p>
        </div>
      </div>

      {/* RIGHT SIDE USER SECTION */}
      <div className="flex items-center gap-5">
        {!isLoggedIn ? (
          <div className="text-sm text-gray-500">Director Portal</div>
        ) : (
          <>
            

            {/* DASHBOARD BUTTON */}
            <Link
              to="/"
              className="text-sm px-3 py-1 rounded-md bg-indigo-50 text-indigo-600
                         hover:bg-indigo-100 transition-all duration-150"
            >
              Dashboard
            </Link>

            {/* LOGOUT BUTTON */}
            <button
              onClick={onLogout}
              className="px-3 py-1 rounded-md border text-sm text-gray-700
                         hover:bg-gray-100 hover:border-gray-300 transition-all duration-150"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
