import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function StudentSearch() {
  /* ===============================
     STATE
  =============================== */

  const [q, setQ] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [filters, setFilters] = useState({
    enrollment: "",
    name: "",
    dob: "",
    date_of_admission: "",
    father_name: "",
    mother_name: "",
    guardian_number: "",
    email: "",
    mobile_number: "",
    department_name: "",
    department_code: "",
    branch_name: "",
    branch_code: "",
    admission_year: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    address_line1: "",
    address_line2: "",
    subject_name: "",
    transaction_reference: "",
    transaction_id: "",
    transaction_type: "",
  });

  const [data, setData] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10); // 👈 show first 10
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [studentsLoading, setStudentsLoading] = useState(false);

  /* ===============================
     HELPERS
  =============================== */

  function handleFilterChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function buildPayload() {
    const payload = {};
    if (q.trim()) payload.q = q.trim();

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "") payload[k] = v;
    });

    return payload;
  }

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length + (q ? 1 : 0);
  }, [filters, q]);

  async function doSearch(e) {
    if (e) e.preventDefault();

    setLoading(true);
    setStudentsLoading(true); // 👈 student section loading
    setError(null);
    setVisibleCount(10);

    try {
      const payload = buildPayload();

      const apiCall =
        Object.keys(payload).length === 0
          ? axios.post(
              "http://localhost:8002/apistudent/searchall",
              {},
              { withCredentials: true }
            )
          : axios.post("http://localhost:8002/apistudent/search", payload, {
              withCredentials: true,
            });

      // ⏳ artificial delay ONLY for students section
      const res = await delayForDemo(apiCall);

      setData(res.data?.data || []);
    } catch (err) {
      setError("Search failed");
      setData([]);
    } finally {
      setLoading(false);
      setStudentsLoading(false);
    }
  }

  function clearFilters() {
    setQ("");
    Object.keys(filters).forEach((k) => (filters[k] = ""));
    setFilters({ ...filters });
    setVisibleCount(10);
    doSearch();
  }

  useEffect(() => {
    doSearch();
    // eslint-disable-next-line
  }, []);

  /* ===============================
     UI
  =============================== */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Student Search</h3>
        {activeFilterCount > 0 && (
          <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
            {activeFilterCount} active filter(s)
          </span>
        )}
      </div>

      {/* 🔍 SEARCH FORM (ENTER KEY ENABLED) */}
      <form
        onSubmit={doSearch}
        className="bg-white border rounded-lg p-4 shadow-sm space-y-3"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search by name, enrollment, email, department..."
          className="w-full px-4 py-2 border rounded focus:ring focus:ring-indigo-200"
        />

        <div className="flex gap-2 flex-wrap">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
          >
            {showAdvanced ? "Hide Advanced Filters" : "Advanced Filters"}
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 border rounded text-sm text-red-1000 hover:bg-red-50"
          >
            Clear All
          </button>
        </div>

        {/* ADVANCED FILTERS */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pt-3">
            {Object.keys(filters).map((key) => (
              <input
                key={key}
                name={key}
                value={filters[key]}
                onChange={handleFilterChange}
                placeholder={key.replace(/_/g, " ")}
                className="px-3 py-2 border rounded text-sm focus:ring focus:ring-indigo-100"
              />
            ))}
          </div>
        )}
      </form>

      {/* RESULTS */}
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {studentsLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 border rounded-lg bg-gray-100 animate-pulse"
            >
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {!studentsLoading && data.length === 0 && (
        <div className="text-sm text-gray-500">No students found</div>
      )}

      {!studentsLoading && data.length > 0 && (
        <>
          <div className="space-y-3">
            {data.slice(0, visibleCount).map((s) => (
              <div
                key={s.enrollment}
                className="p-4 border rounded-lg hover:shadow-md transition bg-white"
              >
                <Link
                  to={`/students/${s.enrollment}`}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  {s.name}
                </Link>
                <div className="text-sm text-gray-500 mt-1">
                  {s.enrollment} • {s.department_name} • {s.admission_year}
                </div>
              </div>
            ))}
          </div>

          {/* SHOW MORE / LESS */}
          {data.length > 10 && (
            <div className="flex justify-center mt-4">
              {visibleCount < data.length ? (
                <button
                  onClick={() => setVisibleCount((c) => c + 10)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  Show More
                </button>
              ) : (
                <button
                  onClick={() => setVisibleCount(10)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  Show Less
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
function delayForDemo(promise) {
  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  }).then(() => promise);
}
