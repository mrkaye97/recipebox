import createFetchClient from "openapi-fetch";
import type { paths } from "./v1";

export const api = createFetchClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:8000",
});
