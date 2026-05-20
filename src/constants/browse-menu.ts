import type { BrowseMenuItem } from "@/types/browse-menu";

/**
 * Browse menu seed data (Figma 4990:21513).
 * Structure is recursive — any child can have its own children.
 * All href values are "#" placeholders until catalog routes exist.
 */
export const BROWSE_MENU_ITEMS: BrowseMenuItem[] = [
  {
    id: "design",
    title: "Design",
    description: "All About Design Course",
    slug: "design",
    href: "#",
    children: [
      {
        id: "illustration",
        title: "Illustration",
        description: "How to be great illustrator",
        slug: "illustration",
        href: "#",
        children: [
          {
            id: "digital-illustration",
            title: "Digital Illustration",
            description: "Create stunning digital art",
            slug: "digital-illustration",
            href: "#",
          },
          {
            id: "vector-illustration",
            title: "Vector Illustration",
            description: "Master vector design tools",
            slug: "vector-illustration",
            href: "#",
          },
        ],
      },
      {
        id: "graphic-design",
        title: "Graphic Design",
        description: "Make more benefit from design",
        slug: "graphic-design",
        href: "#",
      },
      {
        id: "ui-ux-design",
        title: "UI/UX Design",
        description: "Make Design for website and apps",
        slug: "ui-ux-design",
        href: "#",
      },
    ],
  },
  {
    id: "programming",
    title: "Programming",
    description: "Website and Mobile Programming",
    slug: "programming",
    href: "#",
    children: [
      {
        id: "web-programming",
        title: "Web Programming",
        description: "HTML, CSS, JavaScript and more",
        slug: "web-programming",
        href: "#",
      },
      {
        id: "mobile-programming",
        title: "Mobile Programming",
        description: "iOS, Android and cross-platform",
        slug: "mobile-programming",
        href: "#",
      },
    ],
  },
  {
    id: "business-marketing",
    title: "Business & Marketing",
    description: "Business and Marketing Strategies",
    slug: "business-marketing",
    href: "#",
  },
  {
    id: "photo-video",
    title: "Photo & Video",
    description: "Photography and Video Making",
    slug: "photo-video",
    href: "#",
  },
  {
    id: "writing",
    title: "Writing",
    description: "Content Writing and Copywriting",
    slug: "writing",
    href: "#",
  },
];
