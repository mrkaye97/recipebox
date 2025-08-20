import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import { paths } from "./v1";

export const fetchClient = createFetchClient<paths>({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000",
});

export const $api = createClient(fetchClient);
