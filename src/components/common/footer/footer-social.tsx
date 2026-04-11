"use client";

import Link from "next/link";
import { FacebookMono, InstagramMono, XIcon } from "@public/assets/icons";

const socialClass =
  "inline-flex text-zinc-300 transition-opacity hover:opacity-100 opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-sm";

export function FooterSocial() {
  return (
    <div className="flex items-center gap-5">
      <Link
        href="https://x.com"
        className={socialClass}
        aria-label="X"
        target="_blank"
        rel="noopener noreferrer"
      >
        <XIcon width={20} height={20} color="currentColor" />
      </Link>
      <Link
        href="https://www.instagram.com"
        className={socialClass}
        aria-label="Instagram"
        target="_blank"
        rel="noopener noreferrer"
      >
        <InstagramMono width={20} height={20} color="currentColor" />
      </Link>
      <Link
        href="https://www.facebook.com"
        className={socialClass}
        aria-label="Facebook"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FacebookMono width={20} height={20} color="currentColor" />
      </Link>
    </div>
  );
}
