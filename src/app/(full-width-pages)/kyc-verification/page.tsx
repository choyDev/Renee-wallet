
"use client"
import KycVerificationPage from "@/components/landing/Kyc/KycVerficationPage";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";


export default function KycVerification() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B1120]">
      {/* 🟢 Decorative background (same as SignIn) */}
      <div className="absolute inset-0 z-0">
        <svg
          width="1440"
          height="969"
          viewBox="0 0 1440 969"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-0 top-0 opacity-30"
        >
          <mask
            id="mask0_kyc"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1440"
            height="969"
          >
            <rect width="1440" height="969" fill="#090E34" />
          </mask>
          <g mask="url(#mask0_kyc)">
            <path
              opacity="0.1"
              d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
              fill="url(#paint0_linear_kyc)"
            />
            <path
              opacity="0.1"
              d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
              fill="url(#paint1_linear_kyc)"
            />
          </g>
          <defs>
            <linearGradient
              id="paint0_linear_kyc"
              x1="1178.4"
              y1="151.853"
              x2="780.959"
              y2="453.581"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_kyc"
              x1="160.5"
              y1="220"
              x2="1099.45"
              y2="1192.04"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 🟦 KYC Card */}
      <div className="relative z-10 w-full max-w-5xl rounded-2xl bg-white/10 p-12 backdrop-blur-xl shadow-2xl dark:bg-[#1A1D24]/80">
        {/* Header Row: Back + Title */}
        <div className="flex items-center justify-between mb-8">
          {/* <Link
            href="/signin"
            className="text-gray-300 hover:text-white transition flex items-center gap-2"
          >
            ← Back
          </Link> */}
          <div className="mb-8">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700/50 group-hover:bg-blue-600/70 transition-colors">
                <FaArrowLeft className="text-gray-300 group-hover:text-white text-sm" />
              </div>
              <span className="text-sm font-medium group-hover:text-white">
                Back
              </span>
            </button>
          </div>
          <h2 className="text-3xl font-semibold text-white text-center flex-1">
            KYC Verification
          </h2>
        </div>

        {/* KYC Form */}
        <KycVerificationPage />
      </div>
    </section>
  );
}
