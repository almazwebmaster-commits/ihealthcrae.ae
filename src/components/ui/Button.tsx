import { cn } from "@/lib/utils";

export const buttonVariants = {
  primary:
    "bg-brand-600 text-white border-brand-600 hover:bg-brand-700 hover:border-brand-700 active:bg-brand-800",
  accent:
    "bg-accent-500 text-ink-900 border-accent-500 hover:bg-accent-400 hover:border-accent-400 active:bg-accent-600",
  /** Green outline — the quiet call to action (e.g. Add to cart on cards) */
  soft:
    "bg-white text-brand-700 border-brand-600 hover:bg-brand-50 active:bg-brand-100",
  outline:
    "bg-white text-ink-900 border-line-strong hover:border-ink-400 hover:bg-surface",
  ghost: "bg-transparent text-ink-800 border-transparent hover:bg-ink-900/5",
  danger: "bg-sale text-white border-sale hover:brightness-95",
  dark: "bg-ink-900 text-white border-ink-950 hover:bg-ink-800",
} as const;

export const buttonSizes = {
  sm: "h-9 px-3.5 text-xs gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2",
  icon: "size-10 justify-center p-0",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-full border-[1.5px] font-semibold transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...props}
    />
  );
}
