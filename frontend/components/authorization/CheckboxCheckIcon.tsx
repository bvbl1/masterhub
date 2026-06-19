export default function CheckboxCheckIcon({ checked }: { checked: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-[17px] w-[17px] shrink-0 text-black transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        checked ? "opacity-100 scale-100" : "scale-[0.82] opacity-0"
      }`}
      fill="none"
    >
      <path
        d="m4.5 12.75 6 6 9-13.5"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
