import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button, Card, Input } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-6">
        <Card className="w-full p-6">
          <div className="text-xl font-semibold text-slate-100">Sign in</div>
          <div className="mt-1 text-sm text-slate-400">Login to access your team knowledge base.</div>

          {err ? <div className="mt-4 rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</div> : null}

          <div className="mt-5 space-y-3">
            <div>
              <div className="mb-1 text-xs text-slate-400">Email</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-400">Password</div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <Button
              className="w-full"
              disabled={loading}
              onClick={async () => {
                setErr(null);
                setLoading(true);
                try {
                  await login(email, password);
                  nav("/");
                } catch (e: any) {
                  setErr(e.message || "Login failed");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-sm text-slate-400">
              First time?{" "}
              <Link to="/setup" className="text-sky-300 hover:text-sky-200">
                Create the first admin
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
