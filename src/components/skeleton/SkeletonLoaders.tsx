/**
 * Skeleton Loader Components
 * Modern, animated skeleton loaders for all wallet components
 */

import React from "react";

/* ===============================================
   BASE SKELETON COMPONENT
=============================================== */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-300/30 dark:bg-white/10 rounded-md ${className}`}
    />
  );
}

/* ===============================================
   WALLET CARD SKELETON
=============================================== */
export function WalletCardSkeleton() {
  return (
    <div className="rounded-2xl p-px bg-gradient-to-r from-brand-500/35 to-brand-500/10">
      <div className="h-full rounded-2xl border border-gray-200/60 dark:border-white/10
                      bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm min-h-[223px]
                      p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <Skeleton className="h-11 w-11 rounded-xl" />
            {/* Name + Network */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          {/* Badge */}
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Amounts */}
        <div className="h-full flex items-center">
          <div className="mt-4 mb-4 space-y-3 w-full">
            {/* Native token */}
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            {/* USDT (optional) */}
            <Skeleton className="h-7 w-28" />
          </div>
        </div>

        {/* Address section */}
        <div className="mt-auto pt-3 border-t border-gray-200/60 dark:border-white/10">
          <div className="flex items-center justify-between mt-3">
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================================
   BALANCE CARD SKELETON (Total Balance)
=============================================== */
export function BalanceCardSkeleton() {
  return (
    <div className="rounded-2xl p-px bg-gradient-to-r from-brand-500/50 to-cyan-500/40">
      <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 
                      bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm p-4 sm:p-5 
                      shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}

/* ===============================================
   ASSET CARD SKELETON
=============================================== */
export function AssetCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200/60 dark:border-white/10
                    bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm p-4 sm:p-5
                    shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left: Icon + Name */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Right: Amount + USD */}
        <div className="text-right space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

/* ===============================================
   ACTION BUTTONS SKELETON
=============================================== */
export function ActionButtonsSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200/60 dark:border-white/10
                    bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm shadow-sm p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-px bg-gradient-to-br from-brand-400/25 via-transparent to-brand-400/10">
            <div className="aspect-[2/1] rounded-2xl border border-gray-200/60 dark:border-white/10
                            bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm
                            flex flex-col items-center justify-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================================
   CHART SKELETON
=============================================== */
export function ChartSkeleton() {
  return (
    <div className="group relative h-full rounded-2xl p-px bg-gradient-to-br from-brand-400/40 via-transparent to-[#8B5CF6]/30">
      <div className="h-full rounded-2xl border border-gray-200/60 dark:border-white/10 
                      bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm shadow-sm p-5 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Chart area */}
        <div className="min-h-[360px] flex items-center justify-center">
          <div className="w-full space-y-4">
            {/* Chart bars */}
            <div className="flex items-end justify-between gap-2 h-48">
              {Array.from({ length: 12 }).map((_, i) => {
                const heights = ["h-24", "h-32", "h-40", "h-36", "h-28", "h-44", "h-32", "h-36", "h-40", "h-32", "h-28", "h-36"];
                return (
                  <Skeleton
                    key={i}
                    className={`flex-1 ${heights[i]} rounded-t-md`}
                  />
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================================
   TRANSACTION TABLE SKELETON
=============================================== */
export function TransactionTableSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200/60 dark:border-white/10 
                    bg-white/70 dark:bg-[#0B1220]/80 backdrop-blur-sm 
                    shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table header */}
          <thead>
            <tr className="border-b border-gray-200/60 dark:border-gray-700/40">
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="py-3 px-4 text-left">
                  <Skeleton className="h-4 w-16" />
                </th>
              ))}
            </tr>
          </thead>

          {/* Table rows */}
          <tbody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-100/60 dark:border-gray-800/60"
              >
                {/* Coin */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </td>
                {/* Direction */}
                <td className="py-4 px-4">
                  <Skeleton className="h-4 w-16" />
                </td>
                {/* Tx Hash */}
                <td className="py-4 px-4">
                  <Skeleton className="h-4 w-24" />
                </td>
                {/* Amount */}
                <td className="py-4 px-4">
                  <Skeleton className="h-4 w-20" />
                </td>
                {/* Fee */}
                <td className="py-4 px-4">
                  <Skeleton className="h-4 w-16" />
                </td>
                {/* Status */}
                <td className="py-4 px-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                {/* Date */}
                <td className="py-4 px-4">
                  <Skeleton className="h-4 w-24" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===============================================
   FULL PAGE SKELETON (Wallet Overview)
=============================================== */
export function WalletOverviewSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 space-y-5">
      {/* Header with address */}
      <div className="mb-5 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        {/* Chart */}
        <div className="col-span-12 lg:col-span-8">
          <ChartSkeleton />
        </div>

        {/* Right sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <div className="flex h-full flex-col gap-4">
            {/* Total Balance */}
            <BalanceCardSkeleton />

            {/* Asset cards */}
            <div className="grid grid-cols-1 gap-2">
              <AssetCardSkeleton />
              <AssetCardSkeleton />
            </div>

            {/* Action buttons */}
            <div className="mt-auto">
              <ActionButtonsSkeleton />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction table */}
      <TransactionTableSkeleton />
    </div>
  );
}

/* ===============================================
   COMPACT LOADING (for small components)
=============================================== */
export function CompactLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}