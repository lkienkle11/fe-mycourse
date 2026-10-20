/**
 * Clears the `@modal` slot on the locale root and (through `[...catchAll]`)
 * on every other route that is not an intercepted modal. Without it a soft
 * navigation away from `/login` or `/signup` (for example the post-login push
 * to `/home`) keeps the stale modal mounted, so the popup reappears over the
 * destination page.
 */
export default function ModalNone() {
  return null;
}
