"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Heart } from "./Heart";

/** Our hidden door: tap the footer heart five times quickly to sign in. */
export function SecretHeart() {
  const router = useRouter();
  const taps = useRef<number[]>([]);
  const [beat, setBeat] = useState(0);

  function tap() {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    setBeat((b) => b + 1);
    if (taps.current.length >= 5) {
      taps.current = [];
      router.push("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={tap}
      aria-label="Heart"
      className="-m-2 inline-grid place-items-center p-2 text-burgundy"
    >
      <Heart key={beat} className={`size-3.5 ${beat ? "pop" : ""}`} />
    </button>
  );
}
