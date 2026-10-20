import type { MetadataRoute } from "next";
import { buildRobotsTxtRules } from "@/lib/seo/robots-txt";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsTxtRules({ site: { readEnv: true } });
}
