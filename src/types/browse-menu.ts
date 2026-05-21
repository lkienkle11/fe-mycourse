/**
 * Recursive menu item — children can have children of their own.
 * The UI renders one column per depth level on desktop (hover cascade)
 * and nested Accordions on mobile.
 */
export interface BrowseMenuItem {
  id: string;
  title: string;
  description: string;
  slug: string;
  href: string;
  children?: BrowseMenuItem[];
}
