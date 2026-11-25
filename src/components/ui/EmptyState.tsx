import type { ComponentType } from "react";

/** A friendly "nothing here yet" card with an icon. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-tan bg-paper/70 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-wheat text-burgundy">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 font-display text-2xl font-semibold text-cocoa">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-brown">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
