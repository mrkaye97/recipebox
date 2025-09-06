import RecipesScreen from "@/components/recipes-page";
import React from "react";

export default function Library() {
  return <RecipesScreen onlyCurrentUser={false} />;
}
