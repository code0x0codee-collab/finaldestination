// src/components/Homepage/Homepage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNavbar from "./TopNavBar";
import StudentStats from "./StudentStats";
import StudentSearch from "./StudentSearch";
import TeacherSearch from "./TeacherSearch";
import PublicHome from "./PublicHome";
import DepartmentChart from "./DepartmentChart";
import { api } from "../api";
import axios from "axios";

export default function Homepage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [stats, setStats] = useState(null);
  const [activeSearch, setActiveSearch] = useState("student");
  const [loading, setLoading] = useState(true);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    let mounted = true;

    async function checkLogin() {
      try {
        const res = await fetch("http://localhost:8002/admin/finddata", {
          credentials: "include",
        });
        const body = await res.json();

        if (mounted && res.ok && body) {
          const u = body.user || body.data || body;
          setUser({
            id: u?.id,
            name: u?.name || u?.director_name || "Director",
            email: u?.email,
            role: "admin",
          });
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }

    checkLogin();
    return () => (mounted = false);
  }, []);

  /* ================= DASHBOARD DATA ================= */
  useEffect(() => {
    if (isLoggedIn) {
      api.fetchDashboardStats().then((res) => setStats(res.stats));
    }
  }, [isLoggedIn]);

  async function handleLogout() {
    await fetch("http://localhost:8002/admin/logoutAdmin", {
      method: "DELETE",
      credentials: "include",
    });
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        <TopNavbar
          isLoggedIn={isLoggedIn}
          user={user}
          onLogout={handleLogout}
        />

        {!isLoggedIn ? (
          <PublicHome />
        ) : (
          <>
            {/* ================= HEADER ================= */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-slate-500 mt-1">
                  Welcome back,{" "}
                  <span className="font-medium">{user?.name}</span>
                </p>
              </div>
            </div>

            {/* ================= KPI ================= */}
            <StudentStats />

            {/* ================= MAIN CONTENT ================= */}
            {/* ================= MAIN CONTENT ================= */}
            <div className="grid grid-cols-1 gap-6">
              {/* SEARCH + GRAPH AREA */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b">
                  {["student", "teacher"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveSearch(type)}
                      className={`flex-1 py-4 text-sm font-semibold transition
            ${
              activeSearch === type
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                : "text-slate-500 bg-slate-50 hover:bg-slate-100"
            }`}
                    >
                      {type === "student" ? "Student Search" : "Teacher Search"}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="p-6 space-y-10">
                  {/* SEARCH */}
                  <div>
                    {activeSearch === "student" ? (
                      <StudentSearch api={api} />
                    ) : (
                      <TeacherSearch api={api} />
                    )}
                  </div>

                  {/* GRAPH BELOW SEARCH */}
                  <div className="pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">
                        Department & Branch Distribution
                      </h3>
                      <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded">
                        Live Data
                      </span>
                    </div>

                    <DepartmentChart />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
