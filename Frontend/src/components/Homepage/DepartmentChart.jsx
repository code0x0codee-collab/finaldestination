// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

/* ===============================
   Reusable Interactive BarChart
   =============================== */
function BarChart({ title, data = [], initialVisible = 5 }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const [expanded, setExpanded] = useState(false);

  if (data.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-6">
        No data available
      </div>
    );
  }

  const visibleData = expanded ? data : data.slice(0, initialVisible);

  return (
    <div className="space-y-4">
      {visibleData.map((d) => {
        const percent = Math.round((d.count / max) * 100);

        return (
          <div
            key={d.name}
            className="group space-y-1"
          >
            {/* Label row */}
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-medium text-gray-700 cursor-help"
                title={d.name} // tooltip for full name
              >
                {d.name}
              </span>

              <span className="text-sm font-semibold text-gray-700">
                {d.count}
                <span className="ml-1 text-xs text-gray-400">
                  ({percent}%)
                </span>
              </span>
            </div>

            {/* Bar */}
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-3 rounded-full bg-indigo-500 transition-all duration-700 ease-out group-hover:bg-indigo-600"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Show more / less */}
      {data.length > initialVisible && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-indigo-600 hover:underline pt-1"
        >
          {expanded ? "Show less ▲" : "Show more ▼"}
        </button>
      )}
    </div>
  );
}

/* ===============================
   Dashboard Page
   =============================== */
export default function DepartmentChart() {
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await axios.get(
          "http://localhost:8002/apistudent/department-branch-stats",
          { withCredentials: true }
        );

        setDepartments(res.data?.data?.departments || []);
        setBranches(res.data?.data?.branches || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  /* ---------- States ---------- */
  if (loading) {
    return (
      <div className="text-gray-500 animate-pulse">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 bg-red-50 p-4 rounded">
        {error}
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-500">
          Students distribution by department and branch
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="text-lg font-semibold mb-4">
            Departments
          </h2>
          <BarChart
            title="Departments"
            data={departments}
            initialVisible={4}
          />
        </div>

        {/* Branches */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="text-lg font-semibold mb-4">
            Branches
          </h2>
          <BarChart
            title="Branches"
            data={branches}
            initialVisible={5}
          />
        </div>
      </div>
    </div>
  );
}
