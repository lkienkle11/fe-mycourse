import type { Metadata } from "next";

export const SEO_ROBOTS_PRESETS = {
  indexable: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  noindex: {
    index: false,
    follow: true,
  },
  privateApp: {
    index: false,
    follow: false,
    nocache: true,
  },
} as const satisfies Record<string, NonNullable<Metadata["robots"]>>;
