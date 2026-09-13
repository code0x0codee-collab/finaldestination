// src/pages/PublicHome.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function PublicHome() {
  const navigate = useNavigate();

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-3xl font-semibold mb-2">Welcome to the Director Portal</h2>
        <p className="text-gray-600 mb-6">
          Secure access to student records, reports, attendance and certificate generation.
        </p>

        <ul className="list-disc ml-5 text-gray-700 mb-6">
          <li>Quick student & teacher search</li>
          <li>Generate certificates & bulk reports</li>
          <li>Real-time alerts on attendance & fees</li>
        </ul>

        <div className="flex gap-3">
          {/* client-side navigation to /login */}
          <button onClick={() => navigate("/login")} className="btn-primary">
            Login
          </button>

          <button
            onClick={() => navigate("/about")}
            className="btn"
            title="More info about the portal"
          >
            Learn more
          </button>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-tr from-indigo-50 to-white rounded shadow">
        <div className="h-64 bg-white rounded border-dashed border-2 border-gray-200 flex items-center justify-center">
          <span className="text-gray-400">Dashboard preview / promo image</span>
        </div>
      </div>
    </div>
  );
}
