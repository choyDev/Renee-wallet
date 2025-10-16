"use client"
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import React, { useState, useEffect } from "react";


export default function Profile() {
  const [user, setUser] = useState<{ full_name?: string; email?: string } | null>(null);
  useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Error parsing user from localStorage:", err);
        }
      }
    }, []);
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard  userData={user}/>
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </div>
  );
}
