"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function FeeSettingsPage() {
  const [fees, setFees] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/fees");
      const data = await res.json();
      setFees(data);
    })();
  }, []);

  if (!fees) return <div>Loading...</div>;

  const handleChange = (field: string, value: any) => {
    setFees((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    await fetch("/api/admin/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fees),
    });
    alert("Saved!");
  };

  return (
    <div className="space-y-6 p-4 md:p-6 text-gray-900 dark:text-white">
      <div className="max-w-[1400px] mx-auto space-y-8">

        <h1 className="text-2xl font-bold">Fee Settings</h1>

        <Card className="
          rounded-xl 
          bg-gray-50 border border-gray-300 
          dark:bg-[#1A1730] dark:border-gray-900 dark:backdrop-blur-xl
        ">
          <CardHeader>
            <CardTitle className="text-md font-semibold">Global Fee Settings</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            
            <FeeInput
              label="Transfer Fee (%)"
              value={fees.transferFee}
              onChange={(e:any) => handleChange("transferFee", e.target.value)}
            />

            <FeeInput
              label="Swap Fee (%)"
              value={fees.swapFee}
              onChange={(e:any) => handleChange("swapFee", e.target.value)}
            />

            <FeeInput
              label="Bridge Fee (%)"
              value={fees.bridgeFee}
              onChange={(e:any) => handleChange("bridgeFee", e.target.value)}
            />

            <FeeInput
              label="Bridge Gas Buffer (%)"
              value={fees.bridgeGasBuffer}
              onChange={(e:any) => handleChange("bridgeGasBuffer", e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="
              px-6 py-3 rounded-xl 
              bg-indigo-600 text-white font-semibold 
              hover:bg-indigo-500 transition-all
              dark:bg-indigo-500 dark:hover:bg-indigo-400
            "
          >
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
}

function FeeInput({ label, value, onChange }: any) {
  return (
    <div className="w-full">
      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <input
        type="number"
        value={value ?? ""}   // ⭐ FIX HERE
        step="0.01"
        onChange={onChange}
        className="
          w-full px-4 py-3 rounded-xl border text-base
          bg-white border-gray-300 text-gray-900
          dark:bg-[#120F24] dark:border-gray-700 dark:text-white
          transition-all
        "
      />
    </div>
  );
}

