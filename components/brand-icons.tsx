import { cn } from "@/lib/cn";

// https://github.com/unjs/upm/blob/16ad722f616e5ddb7b55f67440d75b4d1a1c2c09/.github/logo.svg
export function UpmIcon() {
  return (
    <svg
      viewBox="0 0 197.9 67.5"
      aria-hidden="true"
      className="h-5 w-6 shrink-0"
      fill="currentColor"
    >
      <path d="M51.3 0V54H12.5L0 41.5V0H18.7V37.8H32.6V0ZM58.8 67.5V0H97.7L111 13.3V40.7L97.7 54H77.5V67.5ZM92.3 15.4H77.5V38.6H92.3ZM117.6 0H185.1L197.9 12.7V54H179.6V15H166.7V54H148.8V15H136V54H117.6Z" />
    </svg>
  );
}

export function NpmIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 7"
      aria-hidden="true"
      className={cn("text-[#cb3837] dark:text-[#ef6b6b]", className)}
      fill="currentColor"
    >
      <path d="M0 0v6h5v1h4V6h9V0H0zm5 5H4V2H3v3H1V1h4v4zm5 0H8v1H6V1h4v4zm7 0h-1V2h-1v3h-1V2h-1v3h-2V1h6v4zM8 2h1v2H8V2z" />
    </svg>
  );
}

export function PnpmIcon() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className="size-5 shrink-0">
      <path
        fill="#f9ad00"
        d="M0 0h50v50H0zM55 0h50v50H55zM110 0h50v50h-50zM110 55h50v50h-50z"
      />
      <path
        fill="currentColor"
        d="M55 55h50v50H55zM0 110h50v50H0zM55 110h50v50H55zM110 110h50v50h-50z"
      />
    </svg>
  );
}

export function LpmIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="size-5 shrink-0">
      <g transform="translate(1, 1)">
        <path
          d="M32.39,4.16 L28.14,5.86 L29.84,1.61 C29.98,1.25 29.94,0.84 29.72,0.52 C29.5,0.19 29.14,0 28.75,0 L5.25,0 C4.86,0 4.5,0.19 4.28,0.52 C4.06,0.84 4.02,1.25 4.16,1.61 L5.86,5.86 L1.61,4.16 C1.25,4.02 0.84,4.06 0.52,4.28 C0.19,4.5 0,4.86 0,5.25 L0,28.75 C0,29.14 0.19,29.5 0.52,29.72 C0.84,29.94 1.25,29.98 1.61,29.84 L5.86,28.14 L4.16,32.39 C4.02,32.75 4.06,33.16 4.28,33.48 C4.5,33.81 4.86,34 5.25,34 L28.75,34 C29.14,34 29.5,33.81 29.72,33.48 C29.94,33.16 29.98,32.75 29.84,32.39 L28.14,28.14 L32.39,29.84 C32.75,29.98 33.16,29.94 33.48,29.72 C33.81,29.5 34,29.14 34,28.75 L34,5.25 C34,4.86 33.81,4.5 33.48,4.28 C33.16,4.06 32.75,4.02 32.39,4.16 Z"
          fill={color}
        />
        <g transform="translate(5.86, 5.86)" fill="#FFFFFF">
          <path d="M0,0 L3.86,3.86 C3.64,4.08 3.52,4.38 3.52,4.69 L3.52,17.59 C3.52,17.9 3.64,18.2 3.86,18.41 C4.08,18.64 4.38,18.76 4.69,18.76 L17.59,18.76 C17.9,18.76 18.2,18.64 18.41,18.41 L22.28,22.28 L0,22.28 L0,0 Z" />
          <path
            d="M0,0 L22.28,0 L22.28,22.28 L18.41,18.41 C18.64,18.2 18.76,17.9 18.76,17.59 L18.76,4.69 C18.76,4.42 18.67,4.17 18.5,3.96 L18.41,3.86 C18.2,3.64 17.9,3.52 17.59,3.52 L4.69,3.52 C4.38,3.52 4.08,3.64 3.86,3.86 L0,0 Z"
            opacity="0.5"
          />
        </g>
      </g>
    </svg>
  );
}
