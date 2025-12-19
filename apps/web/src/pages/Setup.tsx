import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button, Card, Input } from "../components/ui";
import { useAuth } from "../lib/auth";

export default function Setup() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [needs, setNeeds] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.bootstrapStatus()
      .then((r) => setNeeds(r.needsSetup))
      .catch(() => setNeeds(null));
  }, []);

  if (needs === false) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto flex min-h-screen max-w-lg items-center px-6">
          <Card className="w-full p-6">
            <div className="text-xl font-semibold text-slate-100">Setup unavailable</div>
            <div className="mt-2 text-sm text-slate-400">
              An admin already exists. Please login normally.
            </div>
            <div className="mt-5">
              <Button className="w-full" onClick={() => nav("/login")}>Go to login</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-6">
        <Card className="w-full p-6">
          <div className="text-xl font-semibold text-slate-100">Initial setup</div>
          <div className="mt-1 text-sm text-slate-400">
            Create the first admin account (only possible when there are 0 users).
          </div>

          {err ? <div className="mt-4 rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</div> : null}

          <div className="mt-5 space-y-3">
            <div>
              <div className="mb-1 text-xs text-slate-400">Admin email</div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-400">Display name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="IT Admin" />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-400">Password</div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 8 chars" />
            </div>

            <Button
              className="w-full"
              disabled={loading}
              onClick={async () => {
                setErr(null);
                setLoading(true);
                try {
                  await api.bootstrap({ email, password, name });
                  await refresh();
                  nav("/");
                } catch (e: any) {
                  setErr(e.message || "Setup failed");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Creating..." : "Create admin"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
