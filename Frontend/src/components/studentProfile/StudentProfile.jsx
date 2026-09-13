import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function StudentProfile() {
  const { enrollment } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);

  /* ========================= FETCH PROFILE ========================= */

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(
          `http://localhost:8002/apistudent/fullprofile/${encodeURIComponent(enrollment)}`,
          { withCredentials: true }
        );

        if (!mounted) return;
        setProfile(res.data?.data || res.data || null);
      } catch (err) {
        console.error(err);
        setError("Failed to load student profile");
      } finally {
        mounted && setLoading(false);
      }
    }

    fetchProfile();
    return () => (mounted = false);
  }, [enrollment]);

  /* ========================= HELPERS ========================= */

  function parseDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  function monthsBetween(fromDate, toDate = new Date()) {
    if (!fromDate) return 0;
    const yrs = toDate.getFullYear() - fromDate.getFullYear();
    const mos = toDate.getMonth() - fromDate.getMonth();
    return Math.max(0, yrs * 12 + mos);
  }

  function getCourseDurationYears(student = {}) {
    const str = (
      student.course ||
      student.program ||
      student.degree ||
      student.department_name ||
      ""
    )
      .toString()
      .toLowerCase();

    if (str.includes("btech")) return 4;
    if (str.includes("bca") || str.includes("diploma") || str.includes("bvoc")) return 3;
    if (str.includes("mtech") || str.includes("mca")) return 2;
    return 3;
  }

  function formatDateDDMMYYYY(iso) {
    const d = parseDate(iso);
    if (!d) return "-";
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  }

  function formatAdmissionDateJSX(iso) {
    const d = parseDate(iso);
    if (!d) return <span>-</span>;
    return (
      <span>
        {String(d.getDate()).padStart(2, "0")}/
        {String(d.getMonth() + 1).padStart(2, "0")}/
        <span className="font-bold">{d.getFullYear()}</span>
      </span>
    );
  }

  function formatMobile(raw) {
    if (!raw) return "-";
    const s = raw.toString().replace(/\D/g, "");
    return s.length === 10 ? `+91 ${s.slice(0, 5)} ${s.slice(5)}` : raw;
  }

  /* ========================= SEMESTER LOGIC ========================= */

  const semesterInfo = useMemo(() => {
    if (!profile?.student) return null;

    const student = profile.student;
    const doa = parseDate(student.date_of_admission);
    const durationYears = getCourseDurationYears(student);
    const totalSemesters = durationYears * 2;
    const months = monthsBetween(doa);

    let semesterNumber = Math.floor(months / 6) + 1;
    if (semesterNumber < 1) semesterNumber = 1;

    const isPassout = semesterNumber > totalSemesters;

    return {
      semesterNumber: isPassout ? totalSemesters : semesterNumber,
      totalSemesters,
      isPassout,
      statusText: isPassout
        ? "Passout"
        : `Semester ${Math.min(semesterNumber, totalSemesters)}`,
    };
  }, [profile]);

  /* ========================= DERIVED DATA ========================= */

  const student = profile?.student;
  const address = profile?.address;
  const subjects = profile?.subjects || [];
  const cpiList = profile?.cpiList || [];
  const transactions = profile?.transactions || [];

  const currentSubjects = subjects.filter(
    (s) => s.semester === semesterInfo?.semesterNumber
  );

  /* ========================= UI HANDLERS ========================= */

  function handleBack() {
    navigate("/");
  }

  function handleCopyEnrollment() {
    navigator.clipboard.writeText(enrollment);
    alert("Enrollment copied");
  }

  function handleDownloadJson() {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${enrollment}_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ========================= STATES ========================= */

  if (loading)
    return <div className="p-6 text-gray-500 animate-pulse">Loading profile…</div>;

  if (error)
    return <div className="p-6 text-red-600 bg-red-50 rounded">{error}</div>;

  if (!student)
    return <div className="p-6 text-yellow-700 bg-yellow-50 rounded">No student found</div>;

  /* ========================= UI ========================= */

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* TOP ACTIONS */}
      <div className="flex items-center justify-between">
        <button onClick={handleBack} className="text-sm text-gray-600 hover:underline">
          ← Back
        </button>

        <button
          onClick={handleDownloadJson}
          className="px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50"
        >
          Download JSON
        </button>
      </div>

      {/* HEADER */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">{student.name}</h1>

        <div className="flex flex-wrap justify-center gap-2 text-sm">
          <span className="px-3 py-1 bg-gray-100 rounded-full">
            Enrollment: <strong>{student.enrollment}</strong>
          </span>

          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
            {student.branch_name || student.branch_code}
          </span>

          <button
            onClick={handleCopyEnrollment}
            className="px-3 py-1 border rounded-full hover:bg-gray-50"
          >
            Copy
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-xs text-gray-500">Department</div>
          <div className="font-medium">{student.department_name}</div>
          <div className="text-xs text-indigo-600 mt-1">
            Branch: {student.branch_name}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-xs text-gray-500">Admission</div>
          <div className="font-medium">
            {formatAdmissionDateJSX(student.date_of_admission)}
          </div>
          <div className="text-sm text-gray-500">
            Year: {student.admission_year}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-xs text-gray-500">Current Status</div>
          <div className="font-medium">{semesterInfo?.statusText}</div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-xs text-gray-500">Contact</div>
          <div className="font-medium">{student.email}</div>
          <div className="text-sm text-gray-500">
            {formatMobile(student.mobile_number)}
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Date of Birth</div>
                <div className="font-medium">
                  {formatDateDDMMYYYY(student.dob)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Guardian</div>
                <div className="font-medium">
                  {formatMobile(student.guardian_number)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-2">Address</h3>
            {address ? (
              <div className="text-sm text-gray-700">
                {address.address_line1}, {address.city},{" "}
                {address.state} - {address.pincode}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No address</div>
            )}
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-3">Subjects</h3>

            {currentSubjects.map((s) => {
              const subj = s.subject || {};
              return (
                <div key={subj.subject_code} className="border rounded p-3 mb-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{subj.subject_name}</div>
                      <div className="text-xs text-gray-500">
                        {subj.subject_code}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setExpandedSubjectId(
                          expandedSubjectId === subj.subject_code
                            ? null
                            : subj.subject_code
                        )
                      }
                      className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full"
                    >
                      {expandedSubjectId === subj.subject_code
                        ? "Hide"
                        : "Details"}
                    </button>
                  </div>

                  {expandedSubjectId === subj.subject_code && (
                    <div className="mt-2 text-sm text-gray-600">
                      Status: {s.status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-2">Academic Record</h3>
            {cpiList.map((c) => (
              <div key={c.semester_no} className="flex justify-between text-sm">
                <span>Semester {c.semester_no}</span>
                <strong>{c.semester_cpi}</strong>
              </div>
            ))}
          </div>

          {/* ✅ UPDATED TRANSACTIONS SECTION */}
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-3">Fee Transactions</h3>

            {transactions.length === 0 && (
              <div className="text-sm text-gray-500">
                No transactions found
              </div>
            )}

            {transactions.map((t) => (
              <div
                key={t.transaction_id}
                className="border rounded-lg p-3 mb-3 text-sm hover:shadow transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    {t.transaction_type}
                  </span>
                  <strong className="text-green-600">₹{t.amount}</strong>
                </div>

                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <div>
                    <span className="font-medium text-gray-600">
                      Transaction ID:
                    </span>{" "}
                    {t.transaction_id}
                  </div>

                  <div>
                    <span className="font-medium text-gray-600">
                      Reference:
                    </span>{" "}
                    {t.transaction_reference || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 mt-6">
        Semester calculated strictly on 6-month windows from date of admission.
      </div>
    </div>
  );
}
