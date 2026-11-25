/** A titled block on a page, drifting in as it scrolls into view. */
export function Section({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="reveal mt-16 sm:mt-20">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="flex items-center gap-2.5 font-display text-3xl font-semibold text-cocoa sm:text-4xl">
          {Icon && <Icon aria-hidden="true" className="size-6 text-tan sm:size-7" />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
