// src/searches/TeacherSearch.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

/**
 * TeacherSearch
 * - normalizes backend teacher objects to a predictable shape
 * - displays teacher card matching Student card style
 * - supports Enter to search (form submit)
 */
export default function TeacherSearch() {
  const [q, setQ] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function pickName(t) {
    const first = t.first_name ?? t.firstName ?? t.fname ?? null;
    const last = t.last_name ?? t.lastName ?? t.lname ?? null;
    const simple = t.name ?? t.full_name ?? t.fullName ?? t.display_name ?? null;

    if (simple && typeof simple === "string" && simple.trim() !== "") return simple.trim();
    if (first || last) return `${first ?? ""}${last ? " " + last : ""}`.trim();
    if (t.teacher_code) return t.teacher_code;
    if (t.email && typeof t.email === "string") return t.email.split("@")[0];
    if (t.teacher_id || t.id) return `Teacher ${t.teacher_id ?? t.id}`;
    return "-";
  }

  function normalizeTeachers(teachers = []) {
    return teachers.map((t) => {
      const hireYear = t.hire_date ?? t.hireDate ?? t.hire_year ?? null;
      const joinYear = hireYear ? new Date(hireYear).getFullYear() : null;

      return {
        id: t.teacher_id ?? t.id ?? null,
        teacher_code: t.teacher_code ?? t.code ?? null,
        name: pickName(t),
        department_id: t.department_id ?? t.dept ?? null,
        join_year: joinYear ?? "-",
        experience: t.experience ?? t.experience_years ?? null,
        subject_count: Array.isArray(t.subjects) ? t.subjects.length : (t.subject_count ?? null),
        email: t.email ?? t.email_address ?? null,
        mobile: t.mobile_number ?? t.mobile ?? t.phone ?? null,
        notes: t.notes ?? null,
        __raw: t,
      };
    });
  }

  async function doSearch(e) {
    // allow form submit or direct call
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    setLoading(true);
    setError(null);

    const trimmed = q?.trim();
    const url = !trimmed ? "http://localhost:8002/apiteacher/searchall" : "http://localhost:8002/apiteacher/search";
    const body = !trimmed ? {} : { q: trimmed };

    try {
      const res = await axios.post(url, body, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      // defensive parsing of different shapes
      let rawTeachers = [];
      if (Array.isArray(res.data?.data)) {
        rawTeachers = res.data.data;
      } else if (Array.isArray(res.data)) {
        rawTeachers = res.data;
      } else if (Array.isArray(res.data?.teachers)) {
        rawTeachers = res.data.teachers;
      } else {
        rawTeachers = (res.data?.data?.rows) ?? (res.data?.data?.items) ?? [];
      }

      const teachers = normalizeTeachers(rawTeachers);
      setData(teachers);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to fetch teachers.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h3 className="font-medium mb-2">Teacher Search</h3>

      {/* form so Enter triggers search */}
      <form onSubmit={doSearch} className="flex gap-2 mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name / dept"
          className="flex-1 px-3 py-2 border rounded focus:ring focus:ring-indigo-200 outline-none"
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      {/* loading / error */}
      {loading && <div className="text-sm text-gray-500">Searching teachers...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* no results */}
      {!loading && !error && data.length === 0 && (
        <div className="text-sm text-gray-500">No teachers found</div>
      )}

      {/* results */}
      {!loading && data.length > 0 && (
        <div className="max-h-96 overflow-y-auto pr-2 space-y-3 custom-scroll">
          {data.map((t) => (
            <div
              key={t.id ?? JSON.stringify(t)}
              className="p-3 bg-white rounded border hover:shadow transition flex items-center justify-between"
            >
              <div>
                <Link to={`/teachers/${t.teacher_code}`} className="font-medium text-indigo-600 hover:underline">
                  {t.name}
                </Link>

                <div className="text-sm text-gray-500">
                  {t.teacher_code ?? "-"} • Dept {t.department_id ?? "-"} • {t.join_year ?? "-"}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm">{t.email ?? "-"}</div>
                <div className="text-sm text-gray-500">{t.mobile ?? "-"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
