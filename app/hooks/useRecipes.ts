import { useQuery } from "@tanstack/react-query";
import { useUser } from "./useUser";

export const useRecipes = () => {
  const { token } = useUser();

  const { data } = useQuery({
    queryKey: ["recipes", "list"],
    queryFn: async () => {
      if (!token) {
        throw new Error("No auth token available");
      }

      const response = await fetch("http://localhost:8000/recipes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      return response.json();
    },
    enabled: !!token, // Only run query if we have a token
  });

  console.log("Recipes data:", data);

  return {
    data,
  };
};
