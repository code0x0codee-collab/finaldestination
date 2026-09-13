import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/**
 * Login (axios + redirect)
 *
 * Props:
 *  - onSubmit(responseBody) optional callback fired on successful login
 *
 * Backend: POST http://localhost:8002/admin/login
 * Body: { email, password } (JSON)
 * Expected JSON response: e.g. { ok: true, token: '...', user: {...} } or { ok: false, message: '...' }
 */
export default function Login({ onSubmit }) {
  const navigate = typeof useNavigate === "function" ? useNavigate() : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8002/admin/login",
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // enable if backend sets cookies and requires credentials
        }
      );

      const body = res.data;
      console.log("Login response:", body);

      // backend-level error
      if (body && (body.ok === false || body.error)) {
        setError(body.message || body.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      // success: optionally persist token if remember checked
      if (body && body.token && remember) {
        try {
          localStorage.setItem("admin_token", body.token);
        } catch (err) {
          console.warn("Failed to store token", err);
        }
      }

      // call parent's onSubmit (e.g., to set auth context)
      if (onSubmit) {
        try {
          await onSubmit(body);
        } catch (err) {
          // swallow but log — parent may throw for validation
          console.warn("onSubmit handler threw:", err);
        }
      }

      // Redirect to home ('/') — use react-router if available, otherwise fallback
      if (navigate) {
        navigate("/", { replace: true });
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        const body = err.response.data;
        const msg = (body && (body.message || body.error)) || `Login failed (status ${err.response.status})`;
        setError(msg);
      } else if (err.request) {
        setError("No response from server. Is the backend running?");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eef2f3] via-[#dce3e7] to-[#d4e0e8] p-6">
      <a
        href="/"
        className="fixed top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/30 backdrop-blur-md border border-white/30 shadow-lg text-[#172B4D] font-semibold text-sm hover:bg-white/40 transform-gpu transition-all"
        aria-label="Home"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Home</span>
      </a>

      <div className="w-full max-w-[960px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Info Panel */}
        <div
          className="md:flex-1 flex items-center justify-center text-center p-10 bg-cover bg-center"
          style={{
            backgroundImage: "linear-gradient(rgba(23,43,77,0.85), rgba(23,43,77,0.85)), url('/pictures/UIET.jpg')"
          }}
        >
          <div className="text-white max-w-[420px]">
            <img src="https://csjmu.ac.in//wp-content/themes/csjmutheme/imgs-copyrighted/csjmu-logo-main.png" alt="UIET Logo" className="w-28 h-28 mx-auto mb-6 object-contain" />
            <h1 className="text-3xl font-semibold mb-2">Director's Office Portal</h1>
            <p className="text-sm opacity-90">University Institute of Engineering &amp; Technology, CSJMU</p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:flex-1 p-10 flex items-center justify-center">
          <div className="w-full max-w-[380px]">
            <h2 className="text-2xl font-semibold text-[#172B4D] mb-2">Director Login</h2>
            <p className="text-sm text-[#5E6C84] mb-4">Welcome back! Please enter your details.</p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#42526E] mb-2">Email</label>
                <input
                  id="username"
                  name="username"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-[#DFE1E6] rounded-lg text-sm shadow-inner focus:outline-none focus:ring-4 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
                  placeholder="you@domain.edu"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#42526E] mb-2">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-[#DFE1E6] rounded-lg text-sm shadow-inner focus:outline-none focus:ring-4 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-[#5E6C84]">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-[#0052CC] font-medium hover:underline">Forgot Password?</a>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0052CC] text-white rounded-lg font-semibold shadow-lg hover:bg-[#003E99] transform transition hover:-translate-y-0.5 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
