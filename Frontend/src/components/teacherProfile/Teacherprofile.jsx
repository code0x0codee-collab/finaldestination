// src/pages/TeacherProfile.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

/**
 * TeacherProfile (updated to match backend response and route param)
 *
 * Route: <Route path="/teachers/:teacherId" element={<TeacherProfile />} />
 *
 * Expected backend shape:
 * {
 *   statusCode: 200,
 *   data: {
 *     teacher: { teacher_id, teacher_code, first_name, last_name, email, mobile_number, hire_date, notes },
 *     teacher_detail: { teacher_id, dob, qualification, experience_years, address },
 *     subjects: [...],
 *     student_count: 0,
 *     branches: [...]
 *   }
 * }
 */
export default function TeacherProfile() {
  const { teacherId } = useParams(); // <-- use teacherId to match your route
  const navigate = useNavigate();

  const [profileRaw, setProfileRaw] = useState(null); // raw data.data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        

        const res = await axios.get(
          `http://localhost:8002/apiteacher/${encodeURIComponent(teacherId)}`,
          { withCredentials: true }
        );

        if (!mounted) return;

        const payload = res.data?.data ?? null;
        setProfileRaw(payload);
      } catch (err) {
        console.error("Failed to load teacher profile:", err);
        setError("Failed to load profile. Check console.");
        setProfileRaw(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [teacherId]);

  // ----- helpers -----
  function parseDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function fmtDate(iso) {
    const d = parseDate(iso);
    if (!d) return "-";
    return d.toLocaleDateString();
  }
  function yearsBetween(from, to = new Date()) {
    const f = parseDate(from);
    if (!f) return 0;
    const diff = to.getFullYear() - f.getFullYear();
    const birthdayThisYear = new Date(to.getFullYear(), f.getMonth(), f.getDate());
    return diff - (to < birthdayThisYear ? 1 : 0);
  }

  // ----- normalized view model derived from profileRaw -----
  const teacher = profileRaw?.teacher ?? null;
  const teacherDetail = profileRaw?.teacher_detail ?? {};
  const subjects = Array.isArray(profileRaw?.subjects) ? profileRaw.subjects : [];
  const studentCount = profileRaw?.student_count ?? null;
  const branches = Array.isArray(profileRaw?.branches) ? profileRaw.branches : [];

  const tenureYears = useMemo(() => {
    if (!teacher) return null;
    return yearsBetween(teacher.hire_date ?? teacher.hireDate ?? teacher.joining_date);
  }, [teacher]);

  function handleBack() {
    navigate(-1);
  }
  function handleCopyId() {
    navigator.clipboard?.writeText(teacherId).then(() => alert("Teacher ID copied"));
  }
  function handleDownloadJson() {
    const blob = new Blob([JSON.stringify(profileRaw ?? {}, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${teacherId}_teacher_profile.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function handlePrint() {
    window.print();
  }

  // ----- UI states -----
  if (loading) {
    return (
      <div className="p-4 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h3 className="font-semibold text-red-700">Error</h3>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h3 className="font-semibold text-yellow-800">No teacher found</h3>
          <p className="text-sm text-yellow-700">The profile data was empty.</p>
          <button onClick={handleBack} className="mt-3 btn-primary">
            Back
          </button>
        </div>
      </div>
    );
  }

  // ----- render -----
  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">
            ← Back
          </button>

          <div>
            <h1 className="text-2xl font-semibold">
              {teacher.first_name ? `${teacher.first_name} ${teacher.last_name || ""}`.trim() : teacher.name}
            </h1>

            <div className="text-sm text-gray-500">
              ID: <span className="font-medium text-gray-700">{teacher.teacher_id ?? teacher.id ?? teacherId}</span>{" "}
              <button onClick={handleCopyId} className="ml-2 text-xs text-indigo-600 underline">Copy</button>
            </div>

            <div className="text-sm text-gray-500 mt-1">{teacher.email ?? "-"}</div>
            <div className="text-sm text-gray-500 mt-1">Students assigned (total): {studentCount ?? "-"}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleDownloadJson} className="px-3 py-2 bg-white border rounded hover:shadow-sm">
            Download JSON
          </button>
          <button onClick={handlePrint} className="px-3 py-2 bg-white border rounded hover:shadow-sm">
            Print
          </button>
        </div>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow-sm">
          <div className="text-xs text-gray-500">Branch assigned</div>
          <div className="font-medium">
            {branches.length === 0 ? "-" : branches.map((b) => b.branch_name || b.branch_code).join(", ")}
          </div>
        </div>

        <div className="p-4 bg-white rounded shadow-sm">
          <div className="text-xs text-gray-500">Joined</div>
          <div className="font-medium">{fmtDate(teacher.hire_date ?? teacher.hireDate ?? teacher.joining_date)}</div>
          <div className="text-sm text-gray-500">Tenure: {tenureYears ?? 0} yr(s)</div>
        </div>

        <div className="p-4 bg-white rounded shadow-sm">
          <div className="text-xs text-gray-500">Contact</div>
          <div className="font-medium">{teacher.mobile_number ?? teacher.mobile ?? "-"}</div>
          <div className="text-sm text-gray-500">{teacher.email ?? "-"}</div>
        </div>

        <div className="p-4 bg-white rounded shadow-sm">
          <div className="text-xs text-gray-500">Code</div>
          <div className="font-medium">{teacher.teacher_code ?? teacher.code ?? "-"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal details */}
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-2">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Name</div>
                <div className="font-medium">{teacher.first_name ? `${teacher.first_name} ${teacher.last_name}` : teacher.name}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">DOB</div>
                <div className="font-medium">{fmtDate(teacherDetail.dob)}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Qualification</div>
                <div className="font-medium">{teacherDetail.qualification ?? "-"}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Experience (years)</div>
                <div className="font-medium">{teacherDetail.experience_years ?? "-"}</div>
              </div>

              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">Address</div>
                <div className="font-medium">{teacherDetail.address ?? "-"}</div>
              </div>
            </div>
          </div>

          {/* Subjects assigned */}
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-3">Assigned Subjects</h3>

            {subjects.length === 0 ? (
              <div className="text-sm text-gray-500">No subjects assigned</div>
            ) : (
              subjects.map((s) => {
                const sid = s.subject_id ?? s.id ?? s.subject_code ?? s.assignment_id;
                return (
                  <div key={sid} className="mb-3 border rounded p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{s.subject_name ?? s.subject?.subject_name ?? s.subject_code}</div>
                        <div className="text-xs text-gray-500">
                          {s.subject_code ?? s.subject?.subject_code} • {s.credits ?? s.subject?.credits ?? "-"} credits
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm">Semester {s.semester ?? s.subject?.semester ?? "-"}</div>
                        <button
                          onClick={() => setExpandedId((p) => (p === sid ? null : sid))}
                          className="mt-2 px-2 py-1 bg-gray-100 rounded text-xs"
                        >
                          {expandedId === sid ? "Hide" : "Details"}
                        </button>
                      </div>
                    </div>

                    {expandedId === sid && (
                      <div className="mt-3 text-sm text-gray-700">
                        <div className="mb-2">
                          <strong>Subject details</strong>
                          <div className="text-gray-500 mt-2">
                            Academic year: {s.academic_year ?? "-"} • Department: {s.department_id ?? "-"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* right column */}
        <div className="space-y-4">
          {/* Student count */}
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-2">Students</h3>
            <div className="text-xl font-medium">{studentCount ?? 0}</div>
            <div className="text-sm text-gray-500">Total students assigned / taught</div>
          </div>

          {/* Utilities */}
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-2">Utilities</h3>
            <div className="flex flex-col gap-2">
              <button onClick={handleCopyId} className="px-3 py-2 bg-indigo-600 text-white rounded">Copy ID</button>
              <button onClick={handleDownloadJson} className="px-3 py-2 border rounded">Download JSON</button>
              <button onClick={handlePrint} className="px-3 py-2 border rounded">Print</button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-2">Notes</h3>
            <div className="text-sm text-gray-700">{(teacher.notes ?? "-") || "-"}</div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 mt-6">
        Profile loaded from backend endpoint /apiteacher/fullprofile/{teacherId}
      </div>
    </div>
  );
}
