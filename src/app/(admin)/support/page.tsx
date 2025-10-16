"use client";

import React, { useEffect, useState } from "react";

/** Tailwind: ensure `darkMode: "class"` in tailwind.config. */
export default function SupportPage() {
  // Sync theme from localStorage so this page follows Settings
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const root = document.documentElement;
    if (saved === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  // Ticket form state (mocked)
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("kyc");
  const [priority, setPriority] = useState("normal");
  const [email, setEmail] = useState("user@example.com");
  const [refCode, setRefCode] = useState("");
  const [address, setAddress] = useState("");
  const [txHash, setTxHash] = useState("");
  const [message, setMessage] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    toast("Ticket submitted. We'll email you soon.");
    setSubject(""); setMessage(""); setRefCode(""); setAddress(""); setTxHash(""); setAttachmentName(null);
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setAttachmentName(f ? f.name : null);
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      {/* Header */}

      <div className="sticky top-0 z-10 border-b border-slate-200/80 backdrop-blur dark:border-slate-800/60">
        <div className="mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Get help with KYC, deposits, conversions, payouts, and account access.
              </p>
            </div>
            <Badge color="indigo">Avg. response: 2–6h</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto gap-6 px-6 py-8 lg:grid lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <SectionHeader title="Open a ticket" subtitle="Tell us what happened. Add your deposit reference or tx hash for faster triage." />
            <form onSubmit={submitTicket} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Subject"><Input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Unable to see my USDT after conversion" required/></Field>
                <Field label="Category">
                  <Select value={category} onChange={(e)=>setCategory(e.target.value)}>
                    <option value="kyc">KYC / Verification</option>
                    <option value="deposit">TRY Deposit</option>
                    <option value="conversion">TRY → USDT Conversion</option>
                    <option value="payout">On-chain Payout</option>
                    <option value="account">Account / 2FA / Login</option>
                    <option value="api">API / Webhooks</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select value={priority} onChange={(e)=>setPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </Select>
                </Field>
                <Field label="Contact email"><Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@domain.com" required/></Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Deposit ref / payment id (optional)"><Input value={refCode} onChange={(e)=>setRefCode(e.target.value)} placeholder="e.g. PYM-2F9A..." /></Field>
                <Field label="Wallet address (optional)"><Input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="TRON or Solana address" /></Field>
                <Field label="Tx hash (optional)"><Input value={txHash} onChange={(e)=>setTxHash(e.target.value)} placeholder="Blockchain tx id" /></Field>
              </div>

              <Field label="Describe the issue">
                <Textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={6} placeholder="What did you try? What did you expect? When did it occur? Include amounts and exact times if possible." required/>
              </Field>

              <div className="flex items-center justify-between gap-4">
                <label className="inline-flex cursor-pointer items-center gap-3">
                  <input type="file" className="hidden" onChange={onFile} />
                  <GhostButton type="button">Attach screenshot</GhostButton>
                  {attachmentName && <span className="text-xs text-slate-500 dark:text-slate-400">{attachmentName}</span>}
                </label>
                <div className="shrink-0 space-x-3">
                  <Button type="submit">Submit ticket</Button>
                </div>
              </div>
            </form>
          </Card>

          <Card>
            <SectionHeader title="FAQs" subtitle="Quick answers for common issues" />
            <div className="mt-6 divide-y divide-slate-200 dark:divide-slate-800/80">
              <Faq q="My KYC says approved but I can't see deposit addresses." a="Addresses are provisioned on approval. Try refreshing. If still missing, open a ticket under 'KYC / Verification'." />
              <Faq q="TRY deposited but balance is not updated." a="It can take several minutes for the on-ramp webhook to confirm. If your bank shows 'completed' for more than 30 minutes, include your payment reference in a ticket." />
              <Faq q="What fees do you charge?" a="We charge a transparent conversion fee in basis points (bps) visible before executing the trade. The exact fee appears in your conversion receipt." />
              <Faq q="Can I withdraw to my external wallet?" a="Withdrawals are disabled. We auto-payout USDT to your whitelisted address after conversion (if enabled)." />
              <Faq q="Which networks are supported?" a="TRON (USDT-TRC20) and Solana (USDT-SPL). Make sure your address matches the selected chain." />
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-4">
          <Card>
            <SectionHeader title="Contact options" subtitle="Reach us through any of these channels" />
            <div className="mt-6 grid grid-cols-1 gap-3">
              <Row>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">support@example.com</p>
                </div>
                <GhostButton onClick={()=>copy("support@example.com")}>Copy</GhostButton>
              </Row>
              <Row>
                <div>
                  <p className="font-medium">Live chat</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Weekdays 09:00–18:00 (GMT+3)</p>
                </div>
                <Badge color="emerald">Online</Badge>
              </Row>
              <Row>
                <div>
                  <p className="font-medium">Docs</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Guides for deposit, conversion, and payout.</p>
                </div>
                <GhostButton onClick={()=>toast("Opening docs...")}>Open</GhostButton>
              </Row>
            </div>
          </Card>

          <Card>
            <SectionHeader title="System status" subtitle="Real-time components" />
            <div className="mt-6 space-y-3">
              <StatusRow name="KYC Provider" status="Operational" color="emerald" />
              <StatusRow name="On-ramp / Fiat" status="Degraded" color="rose" />
              <StatusRow name="TRON RPC" status="Operational" color="emerald" />
              <StatusRow name="Solana RPC" status="Operational" color="emerald" />
              <StatusRow name="Withdrawals (UI)" status="Disabled" color="indigo" />
            </div>
          </Card>

          <Card>
            <SectionHeader title="Tips for faster resolution" />
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-slate-700 dark:text-slate-300">
              <li>Include your on-ramp reference code for deposit issues.</li>
              <li>Paste exact amounts, currencies, and timestamps (with timezone).</li>
              <li>For on-chain questions, provide the address and tx hash.</li>
              <li>Screenshots of errors or bank confirmation speed things up.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ——— UI PRIMITIVES ——— */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_-20px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-[#0C1428]">
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
        "dark:border-slate-800 dark:bg-[#0A1122] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-600",
        props.className || "",
      ].join(" ")}
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400",
        "outline-none ring-0 focus:border-slate-400 focus:ring-2 focus:ring-indigo-500/50",
        "dark:border-slate-800 dark:bg-[#0A1122] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-600",
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
        "dark:border-slate-800 dark:bg-[#0A1122] dark:text-slate-100 dark:focus:border-slate-600",
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
function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "emerald" | "indigo" | "rose" }) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
    rose: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  };
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${map[color]}`}>{children}</span>;
}
function StatusRow({ name, status, color }: { name: string; status: string; color: "emerald" | "indigo" | "rose" | "slate" }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/30">
      <p className="text-sm text-slate-700 dark:text-slate-300">{name}</p>
      <Badge color={color}>{status}</Badge>
    </div>
  );
}
function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-3">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-1 text-left">
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{q}</span>
        <span className="text-slate-500">{open ? "–" : "+"}</span>
      </button>
      {open && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{a}</p>}
    </div>
  );
}
function copy(text: string) {
  navigator.clipboard?.writeText(text);
  toast("Copied");
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
