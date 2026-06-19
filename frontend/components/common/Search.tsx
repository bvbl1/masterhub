type SearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputId?: string;
};

export default function Search({
  value,
  onChange,
  placeholder = "Search projects by title, provider, or category…",
  inputId = "dashboard-services-search",
}: SearchProps) {
  return (
    <label
      htmlFor={inputId}
      className="flex cursor-text ring-gray-300 items-center gap-2 w-full ring p-3 rounded-lg"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M17.5 17.5L12.5 12.5M14.1667 8.33333C14.1667 11.5528 11.5528 14.1667 8.33333 14.1667C5.11383 14.1667 2.5 11.5528 2.5 8.33333C2.5 5.11383 5.11383 2.5 8.33333 2.5C11.5528 2.5 14.1667 5.11383 14.1667 8.33333L17.5 "
          stroke="#9CA3AF"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder={placeholder}
        className="w-full outline-0 bg-transparent"
        name="search"
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
