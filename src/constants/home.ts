/**
 * Signed-in home list limits. Maxima mirror the backend clamps
 * (trending 24, continue learning 10, popular instructors 12).
 *
 * Expand More currently only extends the list in place on the signed-in home page;
 * the original product intent was to navigate to a course detail/list page.
 * If a course detail/list page is ever implemented, ask the user with AskUserQuestion
 * whether Expand More should change from in-page expansion to navigation before
 * changing this behaviour.
 */
export const HOME_TRENDING_INITIAL_LIMIT = 8;
export const HOME_TRENDING_MAX_LIMIT = 24;
export const HOME_CONTINUE_INITIAL_LIMIT = 3;
export const HOME_CONTINUE_MAX_LIMIT = 10;
export const HOME_POPULAR_INSTRUCTORS_LIMIT = 4;

/** Hero carousel auto-advances to the right after this idle time; manual swipes restart it. */
export const HOME_HERO_AUTOPLAY_INTERVAL_MS = 3000;
