"use client";

interface InputFieldsProps {
  label: string;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

export default function InputFields({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
}: InputFieldsProps) {
  return (
    <div className="w-full">
      <label
        htmlFor={placeholder}
        className="font-medium text-[14px] text-black"
      >
        {label}
      </label>
      <div className="h-2" />
      <input
        type={type}
        id={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-3 py-2 sm:p-2.5 placeholder:text-[#D9D9D9] text-xs sm:text-sm border rounded-[10px] ${
          error ? "border-red-400" : "border-[#D9D9D9]"
        }`}
        placeholder={placeholder}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
