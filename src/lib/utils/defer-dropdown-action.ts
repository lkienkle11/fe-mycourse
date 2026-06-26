/**
 * Defers a dropdown menu action until after Radix closes the menu layer.
 * Use when the action opens a Dialog/AlertDialog to avoid leaving
 * `document.body` with `pointer-events: none`.
 */
export function deferDropdownAction(action: () => void): void {
  window.setTimeout(action, 0);
}
