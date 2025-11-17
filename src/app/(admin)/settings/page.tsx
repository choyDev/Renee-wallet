"use client";

import React, { useEffect, useState } from "react";

export default function SettingsPage() {
  // Mocked state; wire these to your API later
  const [name, setName] = useState("Bounkyo User");
  const [email, setEmail] = useState("user@example.com");
  const [phone, setPhone] = useState("+856 20 9108 3952");
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("en");
  // const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [twoFA, setTwoFA] = useState(true);
  const [notifyKYC, setNotifyKYC] = useState(true);
  const [notifyDeposit, setNotifyDeposit] = useState(true);
  const [notifyPayout, setNotifyPayout] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);
  const [defaultChain, setDefaultChain] = useState("TRON");
  const [tronAddress] = useState("TY2k...2hnv7MZtNq");
  const [solAddress] = useState("4b7k...pQ2mW3d9yp");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [withdrawalsDisabled, setWithdrawalsDisabled] = useState(true);

  const getInitialTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  // ——— Theme persistence (light/dark) ———
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    toast("Profile saved");
  }
  function handleSavePrefs(e: React.FormEvent) {
    e.preventDefault();
    toast("Preferences saved");
  }
  function handleSaveSecurity(e: React.FormEvent) {
    e.preventDefault();
    toast("Security settings updated");
  }
  function copy(text: string) {
    navigator.clipboard?.writeText(text);
    toast("Copied to clipboard");
  }
  function createApiKey() {
    const fake = "sk_live_" + Math.random().toString(36).slice(2, 12) + "••••";
    setApiKey(fake);
    toast("API key created");
  }
  function revokeApiKey() {
    setApiKey(null);
    toast("API key revoked");
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 backdrop-blur dark:border-slate-800/60">
        <div className="mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
              {/* <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage your account, security, notifications, and wallet preferences.
              </p> */}
            </div>
            <Badge color="emerald">KYC: Approved</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto gap-6 px-6 py-8 lg:grid lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-8">
          {/* Profile */}
          {/* <Card>
            <SectionHeader title="Profile" subtitle="Basic information visible to support and in receipts." />
            <form onSubmit={handleSaveProfile} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              </Field>
              <Field label="Email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" />
              </Field>
              <Field label="Phone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+xxx" />
              </Field>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </Card> */}

          {/* Security */}
          <Card>
            <SectionHeader title="Security" subtitle="Protect your account with 2-factor authentication and strong password hygiene." />
            <form onSubmit={handleSaveSecurity} className="mt-6 space-y-4">
              <Row>
                <div>
                  <p className="font-medium">Two-Factor Authentication (2FA)</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Use an authenticator app for sign-in.</p>
                </div>
                <Toggle checked={twoFA} onChange={setTwoFA} />
              </Row>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Current password">
                  <Input type="password" placeholder="••••••••" />
                </Field>
                <Field label="New password">
                  <Input type="password" placeholder="••••••••" />
                </Field>
                <Field label="Confirm new password">
                  <Input type="password" placeholder="••••••••" />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Update security</Button>
              </div>
            </form>
          </Card>

          {/* Notifications */}
          {/* <Card>
            <SectionHeader title="Notifications" subtitle="Choose when we should alert you." />
            <div className="mt-6 space-y-3">
              <Row>
                <div>
                  <p className="font-medium">KYC status updates</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Email when your verification status changes.</p>
                </div>
                <Toggle checked={notifyKYC} onChange={setNotifyKYC} />
              </Row>
              <Row>
                <div>
                  <p className="font-medium">Deposits & conversions</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">TRY received, USDT filled, and conversion receipts.</p>
                </div>
                <Toggle checked={notifyDeposit} onChange={setNotifyDeposit} />
              </Row>
              <Row>
                <div>
                  <p className="font-medium">Payouts</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">On-chain transfers sent and confirmed.</p>
                </div>
                <Toggle checked={notifyPayout} onChange={setNotifyPayout} />
              </Row>
              <Row>
                <div>
                  <p className="font-medium">Product updates</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">New features and tips.</p>
                </div>
                <Toggle checked={notifyMarketing} onChange={setNotifyMarketing} />
              </Row>
            </div>
          </Card> */}

          {/* API Access */}
          {/* <Card>
            <SectionHeader title="API access" subtitle="Create or revoke a personal API key for programmatic access." />
            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Keep this secret. You can revoke it anytime.</p>
                {apiKey ? (
                  <div className="mt-2 flex items-center gap-3">
                    <code className="rounded bg-slate-100 px-2 py-1 text-[13px] text-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
                      {apiKey}
                    </code>
                    <GhostButton onClick={() => copy(apiKey)}>Copy</GhostButton>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No active API key.</p>
                )}
              </div>
              <div className="shrink-0 space-x-3">
                {apiKey ? <DangerButton onClick={revokeApiKey}>Revoke</DangerButton> : <Button onClick={createApiKey}>Create key</Button>}
              </div>
            </div>
          </Card> */}
        </div>

        {/* Right column */}
        {/* <div className="space-y-6 lg:col-span-4">
          <Card>
            <SectionHeader title="Preferences" subtitle="Localization and display options." />
            <form onSubmit={handleSavePrefs} className="mt-6 space-y-4">
              <Field label="Currency">
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option>USD</option>
                  <option>TRY</option>
                </Select>
              </Field>
              <Field label="Language">
                <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="tr">Türkçe</option>
                </Select>
              </Field>
              <Field label="Theme">
                <Select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </Select>
              </Field>
              <div className="flex justify-end">
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>

          <Card>
            <SectionHeader title="Wallet preferences" subtitle="Default chain for payouts and address display." />
            <div className="mt-6 space-y-4">
              <Field label="Default chain">
                <Select value={defaultChain} onChange={(e) => setDefaultChain(e.target.value)}>
                  <option value="TRON">TRON (USDT-TRC20)</option>
                  <option value="SOL">Solana (USDT-SPL)</option>
                </Select>
              </Field>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">TRON address</p>
                <div className="mt-1 flex items-center justify-between">
                  <code className="text-sm text-slate-800 dark:text-slate-200">{tronAddress}</code>
                  <GhostButton onClick={() => copy(tronAddress)}>Copy</GhostButton>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Solana address</p>
                <div className="mt-1 flex items-center justify-between">
                  <code className="text-sm text-slate-800 dark:text-slate-200">{solAddress}</code>
                  <GhostButton onClick={() => copy(solAddress)}>Copy</GhostButton>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Addresses are provisioned after KYC approval. Rotation policies can be configured by support.
              </p>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Danger zone" subtitle="Operational guards to protect user funds." />
            <div className="mt-6 space-y-4">
              <Row>
                <div>
                  <p className="font-medium text-red-600 dark:text-red-300">Disable withdrawals (global)</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    If enabled, all user-initiated withdrawals are blocked. Admin can still process payouts via the queue.
                  </p>
                </div>
                <Toggle checked={withdrawalsDisabled} onChange={setWithdrawalsDisabled} danger />
              </Row>
              <DangerButton onClick={() => toast("Account scheduled for deletion (mock)")}>Delete account</DangerButton>
            </div>
          </Card>
        </div> */}
      </div>
    </div>
  );
}

/* ——— UI PRIMITIVES ——— */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_-20px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-[linear-gradient(145deg,#1C1A2F_0%,#12111F_40%,#080A12_100%)]">
      <div className="p-6">{children}</div>
    </div>
  );
}
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
      {children}
    </div>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400",
        "outline-none ring-0 focus:border-slate-400 focus:ring-2 focus:ring-indigo-500/50",
        "dark:border-slate-800 dark:bg-[linear-gradient(145deg,#1C1A2F_0%,#12111F_40%,#080A12_100%)] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-600",
        props.className || "",
      ].join(" ")}
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900",
        "outline-none focus:border-slate-400 focus:ring-2 focus:ring-indigo-500/50",
        "dark:border-slate-800 dark:bg-[linear-gradient(145deg,#1C1A2F_0%,#12111F_40%,#080A12_100%)] dark:text-slate-100 dark:focus:border-slate-600",
        props.className || "",
      ].join(" ")}
    />
  );
}
function Button({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white",
        "hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60",
        "shadow-[0_6px_20px_-6px_rgba(79,70,229,0.45)]",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
function GhostButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-transparent px-3 py-1.5 text-sm text-slate-700",
        "hover:border-slate-400 hover:bg-slate-100",
        "dark:border-slate-800 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900/40",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
function DangerButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white",
        "hover:bg-rose-500 active:bg-rose-700",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "emerald" | "indigo" | "rose" }) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
    rose: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  };
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${map[color]}`}>{children}</span>;
}
function Toggle({ checked, onChange, danger }: { checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-6 w-11 rounded-full transition-colors",
        checked ? (danger ? "bg-rose-600" : "bg-indigo-600") : "bg-slate-300 dark:bg-slate-700",
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
function toast(msg: string) {
  if (typeof window === "undefined") return;
  const el = document.createElement("div");
  el.textContent = msg;
  el.className =
    "fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-lg dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}
