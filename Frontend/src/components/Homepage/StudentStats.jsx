// src/components/KpiRow.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function StudentStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    try {
      setLoading(true);

      const [studentRes, teacherRes] = await Promise.all([
        axios.get("http://localhost:8002/apistudent/totalstudent", { withCredentials: true }),
        axios.get("http://localhost:8002/apiteacher/totalteacher", { withCredentials: true }),
      ]);
      console.log(studentRes);

      setStats({
        totalStudents: studentRes.data?.data?.totalStudents ?? 0,
        totalTeachers: teacherRes.data?.data?.totalTeachers ?? 0,
      });
    } catch (err) {
      console.error("Error loading stats:", err);
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-white rounded shadow animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard title="Total Students" value={stats.totalStudents} />
      <KpiCard title="Total Teachers" value={stats.totalTeachers} />
    </div>
  );
}

function KpiCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow flex flex-col">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
