// src/shared/utils/slugify.js

/**
 * Converts a string to a URL-safe slug.
 * Examples:
 *   "Hello World!" → "hello-world"
 *   "Node.js & Express" → "nodejs-and-express"
 */
export default function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')  // remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, '-')   // replace spaces/underscores with hyphens
    .replace(/--+/g, '-')      // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');  // strip leading/trailing hyphens
}
