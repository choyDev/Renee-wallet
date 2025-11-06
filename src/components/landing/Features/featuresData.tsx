import { Feature } from "@/types/feature";

const featuresData: Feature[] = [
  {
    id: 1,
    icon: (
      <svg width="40" height="41" viewBox="0 0 40 41" className="fill-current">
        <path opacity="0.5" d="M37.78 40.22H24A2 2 0 0 1 22 38.22V20a2 2 0 0 1 2-2h13.78A2 2 0 0 1 40 20v18.22a2 2 0 0 1-2.22 2Z" />
        <path d="M23.22 0c-.55 0-1 .45-1 1v11.33c0 .55.45 1 1 1H39c.55 0 1-.45 1-1V1c0-.55-.45-1-1-1H23.22ZM0 39a1 1 0 0 0 1 1h15.78a1 1 0 0 0 1-1V27.67a1 1 0 0 0-1-1H1a1 1 0 0 0-1 1V39Zm0-17.78a1 1 0 0 0 1 1h15.78a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1a1 1 0 0 0-1 1v20.22Z"/>
      </svg>
    ),
    title: "Custodial multi-chain wallet",
    paragraph: "TRX, ETH, XMR, SOL, BTC, XRP, DOGE balances in one place. USDT on ERC-20 / TRC-20 / SPL.",
  },
  {
    id: 2,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path opacity="0.5" d="M4 8h32v6H4zM4 19h22v6H4zM4 30h28v6H4z"/>
      </svg>
    ),
    title: "Crypto payments",
    paragraph: "Create payment requests and invoices; accept from individuals or institutions directly on-chain.",
  },
  {
    id: 3,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path d="M8 6h24v4H8zM8 18h24v4H8zM8 30h24v4H8z" />
      </svg>
    ),
    title: "Merchant tools",
    paragraph: "Checkout links, QR codes, status webhooks, and settlement logs for accounting.",
  },
  {
    id: 4,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path d="M20 3l6 10h-5v14h-2V13h-5l6-10z" />
        <circle cx="32" cy="32" r="6" opacity="0.5" />
      </svg>
    ),
    title: "Swap / Bridge (in-wallet)",
    paragraph: "Optional crypto ramp inside the wallet for supported chains. No fiat rails.",
  },
  {
    id: 5,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path opacity="0.5" d="M20 30c2.75 0 5 2.25 5 5s-2.25 5-5 5s-5-2.25-5-5s2.25-5 5-5Z" />
        <path d="M33 7H7a3 3 0 0 0-3 3v11h32V10a3 3 0 0 0-3-3Z"/>
      </svg>
    ),
    title: "Status & confirmations",
    paragraph: "On-chain detection and confirmations per network with clear payment statuses.",
  },
  {
    id: 6,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" className="fill-current">
        <path d="M20 4 6 10v8c0 8.28 5.64 16.07 14 18 8.36-1.93 14-9.72 14-18v-8L20 4Z" />
      </svg>
    ),
    title: "Security first",
    paragraph: "Encrypted custody, HTTPS, audit logs, and signed webhooks. Crypto-only compliance posture.",
  },
];

export default featuresData;
