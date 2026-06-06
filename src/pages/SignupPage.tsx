import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type SignupPageProps = {
  onBackToLogin: () => void;
};

export default function SignupPage({ onBackToLogin }: SignupPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [requestedRole, setRequestedRole] = useState("Warehouseman");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();

    if (!cleanFullName) {
      setErrorMsg("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (!cleanEmail) {
      setErrorMsg("Please enter your email.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanFullName,
          requested_role: requestedRole,
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setMessage(
      "Account request submitted. Please wait for Admin approval before logging in."
    );

    setFullName("");
    setEmail("");
    setRequestedRole("Warehouseman");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Create Account
        </h1>

        <p className="text-sm text-slate-500 mb-6">
          Your account will be reviewed before access is granted.
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Requested Role
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value)}
            >
              <option value="Accounting Admin">Accounting Admin</option>
              <option value="Payroll Admin">Payroll Admin</option>
              <option value="Permitting Admin">Permitting Admin</option>
              <option value="Warehouseman">Warehouseman</option>
              <option value="Procurement Staff">Procurement Staff</option>
              <option value="Engineer">Engineer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {errorMsg && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {errorMsg}
            </div>
          )}

          {message && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-lg py-2 font-medium disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Submit Account Request"}
          </button>
        </form>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full mt-4 text-sm text-slate-600 hover:text-slate-900"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}