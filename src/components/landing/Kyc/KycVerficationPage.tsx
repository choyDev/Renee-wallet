
"use client";

import React, { useState } from "react";
import { FaPassport, FaIdCard, FaCar, FaHome, } from "react-icons/fa";
import { useRouter } from "next/navigation";

const KycVerificationPage = () => {
  const [kycType, setKycType] = useState<"personal" | "corporate">("personal");
  const [selectedDoc, setSelectedDoc] = useState<string | null>("passport");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      {/* Scene Switcher */}
      <div className="flex justify-center mb-10">
        <div className="flex rounded-full bg-gray-200 dark:bg-[#2C303B] p-1">
          <button
            type="button"
            onClick={() => setKycType("personal")}
            className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
              kycType === "personal"
                ? "bg-primary text-white shadow"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3B4050]"
            }`}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => setKycType("corporate")}
            className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
              kycType === "corporate"
                ? "bg-primary text-white shadow"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3B4050]"
            }`}
          >
            Corporate
          </button>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {kycType === "personal" ? (
          <>
            <Input label="Full Name" name="full_name" required />
            <Input label="National ID / Passport" name="id_number" required />
            <Input label="Date of Birth" name="dob" type="date" required />
            <Input label="Nationality" name="nationality" required />

            {/* New Modern Document Selector */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                Choose Document Type
              </h3>
              <DocumentUploadSelector
                selected={selectedDoc}
                onSelect={setSelectedDoc}
              />
            </div>

            <div className="md:col-span-2 flex justify-center mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 px-10 py-4 w-full md:w-auto rounded-md text-white font-semibold shadow-lg transition"
              >
                {loading ? "Submitting..." : "Submit Verification"}
              </button>
            </div>
          </>
        ) : (
          <>
            <Input label="Company Name" name="company_name" required />
            <Input
              label="Registration Number"
              name="registration_number"
              required
            />
            <Input label="Tax ID (optional)" name="tax_id" />
            <Select label="Business Type" name="business_type" required>
              <option value="">Select Type</option>
              <option value="corporate">Corporate</option>
              <option value="sole">Sole Proprietor</option>
              <option value="partnership">Partnership</option>
              <option value="ngo">NGO / Foundation</option>
            </Select>
            <Input
              label="Authorized Person"
              name="authorized_person"
              required
              className="md:col-span-2"
            />

            {/* Modernized Upload Section */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                Upload Required Documents
              </h3>
              <DocumentUploadSelector
                selected={selectedDoc}
                onSelect={setSelectedDoc}
              />
            </div>

            <div className="md:col-span-2 flex justify-center mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 px-10 py-4 w-full md:w-auto rounded-md text-white font-semibold shadow-lg transition"
              >
                {loading ? "Submitting..." : "Submit Verification"}
              </button>
            </div>
          </>
        )}
      </form>
    </>
  );
};

//
// 📦 Modern Document Selector (2 per line like Binance)
//
const DocumentUploadSelector = ({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (value: string) => void;
}) => {
  const documents = [
    {
      id: "passport",
      label: "Passport",
      icon: <FaPassport size={24} />,
      recommended: true,
    },
    { id: "id_card", label: "ID Card", icon: <FaIdCard size={24} /> },
    { id: "drivers_license", label: "Driver's License", icon: <FaCar size={24} /> },
    { id: "residence", label: "Residence Permit", icon: <FaHome size={24} /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => onSelect(doc.id)}
          className={`relative flex cursor-pointer items-center justify-between border rounded-lg p-4 transition 
            ${
              selected === doc.id
                ? "border-blue-500 bg-blue-600/10 shadow-md"
                : "border-gray-600 hover:border-blue-400"
            }`}
        >
          <div className="flex items-center gap-3 text-gray-200">
            <div
              className={`p-2 rounded-md ${
                selected === doc.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {doc.icon}
            </div>
            <span className="text-base font-medium">{doc.label}</span>
          </div>
          {doc.recommended && (
            <span className="absolute top-2 right-2 rounded-sm bg-blue-500 text-xs text-white px-2 py-0.5">
              Recommended
            </span>
          )}
          {selected === doc.id && (
            <span className="absolute bottom-2 right-3 text-blue-500 text-sm">
              ✓
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

//
// 🧱 Shared Inputs
//
const Input = ({
  label,
  name,
  type = "text",
  required = false,
  className = "",
}: any) => (
  <div className={className}>
    <label className="block text-sm font-medium mb-1 text-gray-300">
      {label}
    </label>
    <input
      type={type}
      name={name}
      required={required}
      className="w-full border border-gray-600 rounded-md px-3 py-2 text-gray-100 bg-[#1E212A] focus:ring-2 focus:ring-blue-500 outline-none"
    />
  </div>
);

const Select = ({ label, name, required = false, children }: any) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-gray-300">
      {label}
    </label>
    <select
      name={name}
      required={required}
      className="w-full border border-gray-600 rounded-md px-3 py-2 text-gray-100 bg-[#1E212A] focus:ring-2 focus:ring-blue-500 outline-none"
    >
      {children}
    </select>
  </div>
);

export default KycVerificationPage;
