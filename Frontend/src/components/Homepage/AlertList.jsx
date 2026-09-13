// src/components/AlertsList.jsx
import React from "react";

export default function AlertsList({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return <div className="text-sm text-gray-500">All clear</div>;

  return (
    <ul className="space-y-2">
      {alerts.map((a) => (
        <li key={a.id} className="flex items-center justify-between bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
          <div>
            <div className="font-medium">{a.type}</div>
            <div className="text-sm text-gray-600">{a.text}</div>
          </div>
          <div>
            <button className="text-sm underline">View</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
