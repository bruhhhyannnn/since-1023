import { House, Images } from "lucide-react";
import { Heart } from "@/components/Heart";
import { PageTransition } from "@/components/motion/PageTransition";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-wheat text-burgundy">
          <Heart className="beat size-7" />
        </span>
        <p className="enter eyebrow mt-6">Page not found</p>
        <h1 className="enter mt-2 font-display text-5xl font-semibold text-cocoa" style={{ "--d": "100ms" } as React.CSSProperties}>
          This one got lost
        </h1>
        <p className="enter mt-3 text-brown" style={{ "--d": "200ms" } as React.CSSProperties}>
          But we didn&apos;t. Let&apos;s go back to us.
        </p>
        <div className="enter mt-8 flex flex-wrap justify-center gap-2" style={{ "--d": "300ms" } as React.CSSProperties}>
          <ButtonLink href="/" icon={House}>
            Back home
          </ButtonLink>
          <ButtonLink href="/memories" variant="secondary" icon={Images}>
            Our memories
          </ButtonLink>
        </div>
      </div>
    </PageTransition>
  );
}
