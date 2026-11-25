import Link from "next/link";
import type { ComponentProps, ComponentType } from "react";

/* One set of buttons for the whole site. */

type Icon = ComponentType<{ className?: string }>;

const variants = {
  primary: "bg-burgundy text-cream shadow-sm shadow-burgundy/20 hover:bg-burgundy-dark",
  secondary: "border border-wheat-deep bg-paper text-cocoa hover:border-tan hover:text-burgundy",
  ghost: "text-brown hover:bg-wheat/60 hover:text-burgundy",
  danger: "bg-[#b3261e] text-white shadow-sm shadow-[#b3261e]/25 hover:bg-[#8f1d17]",
  /** On top of photos. */
  light: "bg-white text-cocoa shadow-sm hover:bg-cream",
  glass: "bg-white/15 text-white backdrop-blur hover:bg-white/25",
};
const sizes = {
  sm: "h-9 gap-1.5 px-3.5 text-sm [&_svg]:size-4",
  md: "h-11 gap-2 px-5 text-sm [&_svg]:size-[18px]",
  lg: "h-12 gap-2 px-6 text-base [&_svg]:size-5",
};

export type Variant = keyof typeof variants;
export type Size = keyof typeof sizes;

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `press inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0 ${variants[variant]} ${sizes[size]} ${extra}`;
}

type Common = { variant?: Variant; size?: Size; icon?: Icon; iconRight?: Icon };

export function Button({ variant, size, icon: Icon, iconRight: IconRight, className = "", children, type = "button", ...props }: Common & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...props}>
      {Icon && <Icon aria-hidden="true" />}
      {children}
      {IconRight && <IconRight aria-hidden="true" />}
    </button>
  );
}

export function ButtonLink({ variant, size, icon: Icon, iconRight: IconRight, className = "", children, ...props }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {Icon && <Icon aria-hidden="true" />}
      {children}
      {IconRight && <IconRight aria-hidden="true" />}
    </Link>
  );
}

const iconSizes = { sm: "size-9 [&_svg]:size-[18px]", md: "size-11 [&_svg]:size-5", lg: "size-12 [&_svg]:size-6" };

/** A round button with just an icon (it still has a name for screen readers). */
export function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = "md",
  className = "",
  children,
  type = "button",
  ...props
}: { icon: Icon; label: string; variant?: Variant; size?: Size } & ComponentProps<"button">) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`press relative inline-grid shrink-0 place-items-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-45 ${variants[variant]} ${iconSizes[size]} ${className}`}
      {...props}
    >
      <Icon aria-hidden="true" />
      {children}
    </button>
  );
}

/** A quiet text link with an icon, like the "All memories" link back from an album. */
export function BackLink({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon: Icon }) {
  return (
    <Link
      href={href}
      className="press group -ml-1.5 inline-flex items-center gap-1 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-brown transition-colors hover:bg-wheat/60 hover:text-burgundy"
    >
      <Icon aria-hidden="true" className="size-4 transition-transform group-hover:-translate-x-0.5" />
      {children}
    </Link>
  );
}
