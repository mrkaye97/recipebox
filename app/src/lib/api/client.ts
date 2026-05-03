import createFetchClient from "openapi-fetch";
import type { paths } from "./v1";

const baseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "/api");

export const api = createFetchClient<paths>({
  baseUrl,
});
