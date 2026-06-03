/** Public source repository — override via VITE_REPOSITORY_URL. */
export const REPOSITORY_URL =
  import.meta.env.VITE_REPOSITORY_URL ??
  "https://github.com/viktorelmer/cash";

/** Creator GitHub profile — override via VITE_CREATOR_URL. */
export const CREATOR_GITHUB_URL =
  import.meta.env.VITE_CREATOR_URL ?? "https://github.com/viktorelmer";

export const CREATOR_NAME =
  import.meta.env.VITE_CREATOR_NAME ?? "viktorelmer";
