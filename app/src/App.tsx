import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./lib/api/client";
import type { components } from "./lib/api/v1";
import ReactCardFlip from "./ReactCardFlip";

type Recipe = components["schemas"]["src__schemas__Recipe"];
type Ingredient = components["schemas"]["RecipeIngredient"];
type Instruction = components["schemas"]["RecipeInstruction"];
type RecipeType = components["schemas"]["RecipeType"];

function getStoredToken(): string | null {
  return localStorage.getItem("recipebox_token");
}

function storeToken(token: string) {
  localStorage.setItem("recipebox_token", token);
}

function clearToken() {
  localStorage.removeItem("recipebox_token");
}

function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

const TYPE_INFO: Record<RecipeType, { bg: string; text: string; label: string }> = {
  starter:   { bg: "#e8a87c", text: "#5a2d0c", label: "Starter" },
  main:      { bg: "#d35f5f", text: "#4a0e0e", label: "Main" },
  salad:     { bg: "#7bc67e", text: "#1a4a1e", label: "Salad" },
  dessert:   { bg: "#c98bdb", text: "#3d1050", label: "Dessert" },
  snack:     { bg: "#e6c84e", text: "#4a3a00", label: "Snack" },
  cocktail:  { bg: "#5ba4cf", text: "#0e2d4a", label: "Cocktail" },
  condiment: { bg: "#cf9b5a", text: "#4a2a00", label: "Condiment" },
  other:     { bg: "#a0998f", text: "#2c1810", label: "Other" },
};

function AuthScreen({ onAuth }: { onAuth: (token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "login") {
      const { data, error: apiError } = await api.POST("/auth/login", {
        body: { username: email, password, scope: "read write" },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        bodySerializer: (body) => {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
            if (v != null) params.set(k, String(v));
          }
          return params.toString();
        },
      });

      setLoading(false);
      if (apiError || !data) {
        setError("Invalid email or password");
        return;
      }
      storeToken(data.access_token);
      onAuth(data.access_token);
    } else {
      const { data, error: apiError } = await api.POST("/auth/register", {
        body: { email, name, password, privacy_preference: "private" },
      });

      setLoading(false);
      if (apiError || !data) {
        setError("Registration failed");
        return;
      }
      storeToken(data.access_token);
      onAuth(data.access_token);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-cream-dark bg-cream text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-cardboard mb-3 font-body";

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl shadow-lg p-8 w-full max-w-sm"
      >
        <h1 className="font-display text-3xl font-bold text-center mb-6 text-ink">
          Recipe Box
        </h1>
        {error && (
          <p className="text-accent text-sm text-center mb-4">{error}</p>
        )}
        {mode === "register" && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2 rounded-lg bg-cardboard text-white font-body font-semibold hover:bg-cardboard-dark transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading
            ? mode === "login" ? "Signing in..." : "Creating account..."
            : mode === "login" ? "Sign In" : "Create Account"}
        </button>
        <p className="text-center text-sm text-ink-light mt-4 font-body">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={switchMode}
            className="text-cardboard-dark hover:text-accent font-medium cursor-pointer"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}

function RecipeCard({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleClose]);

  const ingredients = recipe.ingredients ?? [];
  const instructions = [...(recipe.instructions ?? [])].sort(
    (a, b) => a.step_number - b.step_number,
  );

  const formatQuantity = (ing: Ingredient) => {
    const qty = ing.quantity ? `${ing.quantity}` : "";
    const unit = ing.units || "";
    return [qty, unit].filter(Boolean).join(" ");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ isolation: "isolate" }}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />

      <div
        className={`relative z-10 w-full max-w-3xl cursor-pointer ${closing ? "animate-put-back" : "animate-pull-out"}`}
        style={{ aspectRatio: "5 / 3", maxHeight: "min(80vh, 540px)" }}
        onClick={(e) => {
          e.stopPropagation();
          setFlipped(!flipped);
        }}
      >
        <ReactCardFlip
          isFlipped={flipped}
          flipDirection="horizontal"
          flipSpeedFrontToBack={0.6}
          flipSpeedBackToFront={0.6}
          containerStyle={{ height: "100%" }}
        >
          <div className="index-card overflow-hidden flex flex-col h-full">
            <div className="card-header-line px-6 pt-5 pb-3">
              <h2 className="handwritten text-3xl font-bold text-ink leading-tight">
                {recipe.name}
              </h2>
              <p className="handwritten text-lg text-ink-light mt-0.5">
                {recipe.author}
                {recipe.cuisine ? ` · ${recipe.cuisine}` : ""}
                {recipe.time_estimate_minutes
                  ? ` · ${recipe.time_estimate_minutes} min`
                  : ""}
              </p>
            </div>
            <div className="flex-1 overflow-hidden py-4 pr-6 lined-card cramped-content">
              <h3 className="handwritten text-xl font-semibold text-ink-blue mb-2 underline decoration-card-margin/40 col-span-all">
                Ingredients
              </h3>
              <ul className="space-y-0.5">
                {ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="handwritten text-base text-ink flex gap-1.5 break-inside-avoid"
                  >
                    <span className="text-ink-blue font-semibold shrink-0">
                      {formatQuantity(ing)}
                    </span>
                    <span>{ing.name}</span>
                  </li>
                ))}
                {ingredients.length === 0 && (
                  <li className="handwritten text-ink-light/60 text-base italic">
                    No ingredients listed
                  </li>
                )}
              </ul>
              {recipe.notes && (
                <div className="mt-3 pt-2 border-t border-card-margin/30 break-inside-avoid">
                  <p className="handwritten text-base text-ink-light italic">
                    * {recipe.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="index-card overflow-hidden flex flex-col h-full">
            <div className="card-header-line px-6 pt-5 pb-3">
              <h2 className="handwritten text-3xl font-bold text-ink leading-tight">
                {recipe.name}
              </h2>
              <p className="handwritten text-lg text-ink-light mt-0.5">
                Instructions
              </p>
            </div>
            <div className="flex-1 overflow-hidden py-4 pr-6 lined-card cramped-content">
              <ol className="space-y-1.5">
                {instructions.map((step: Instruction) => (
                  <li
                    key={step.step_number}
                    className="handwritten text-base text-ink flex gap-1.5 break-inside-avoid"
                  >
                    <span className="text-ink-blue font-bold shrink-0">
                      {step.step_number}.
                    </span>
                    <span className="leading-snug">{step.content}</span>
                  </li>
                ))}
                {instructions.length === 0 && (
                  <li className="handwritten text-ink-light/60 text-base italic">
                    No instructions listed
                  </li>
                )}
              </ol>
            </div>
          </div>
        </ReactCardFlip>
      </div>
    </div>
  );
}

const SCREW_STYLE: React.CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: "radial-gradient(circle at 35% 35%, #c09050, #7a5020)",
  boxShadow: "inset 0 1px 1px rgba(0,0,0,0.3)",
  position: "absolute",
};

function BoxIllustration({
  isOpen,
  onOpen,
}: {
  isOpen: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className={`select-none ${!isOpen ? "cursor-pointer" : ""}`}
      style={{ perspective: "700px", perspectiveOrigin: "50% -20%" }}
      onClick={!isOpen ? onOpen : undefined}
    >
      <div style={{ width: 280, transformStyle: "preserve-3d" }}>
        {/* Lid */}
        <div
          style={{
            width: 280,
            height: 78,
            background:
              "linear-gradient(155deg, #8b6245 0%, #5e3d2a 55%, #47301f 100%)",
            borderRadius: "8px 8px 0 0",
            position: "relative",
            overflow: "hidden",
            transformOrigin: "bottom center",
            transform: isOpen ? "rotateX(110deg)" : "rotateX(0deg)",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 2,
            boxShadow: "0 -1px 4px rgba(0,0,0,0.15)",
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (i + 1) * 21,
                top: 0,
                bottom: 0,
                width: 1,
                background: "rgba(0,0,0,0.07)",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "rgba(255,255,255,0.1)",
            }}
          />
          {/* Latch ring */}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 26,
              height: 17,
              border: "2px solid #c4a070",
              borderRadius: "50% 50% 0 0",
              borderBottom: "none",
            }}
          />
        </div>

        {/* Box body */}
        <div
          style={{
            width: 280,
            height: 132,
            background:
              "linear-gradient(170deg, #7a5540 0%, #5c3d2e 55%, #3e2518 100%)",
            borderRadius: "0 0 8px 8px",
            position: "relative",
            overflow: "hidden",
            boxShadow:
              "0 8px 28px rgba(30, 15, 8, 0.4), 0 2px 0 #3e2518",
            zIndex: 1,
          }}
        >
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (i + 1) * 23,
                top: 0,
                bottom: 0,
                width: 1,
                background: "rgba(0,0,0,0.07)",
              }}
            />
          ))}

          {/* Label plate */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 148,
              height: 42,
              background:
                "linear-gradient(140deg, #d4b28c 0%, #b88850 50%, #c9a472 100%)",
              border: "1.5px solid #9a7040",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 6px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ ...SCREW_STYLE, top: 5, left: 7 }} />
            <div style={{ ...SCREW_STYLE, top: 5, right: 7 }} />
            <div style={{ ...SCREW_STYLE, bottom: 5, left: 7 }} />
            <div style={{ ...SCREW_STYLE, bottom: 5, right: 7 }} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "#3a1e0a",
                textShadow: "0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              Recipes
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "rgba(0,0,0,0.12)",
              borderRadius: "0 0 8px 8px",
            }}
          />
        </div>

        {/* Ground shadow */}
        <div
          style={{
            position: "absolute",
            bottom: -12,
            left: "8%",
            right: "8%",
            height: 12,
            background:
              "radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}

function RecipeSummaryCard({
  recipe,
  onClick,
}: {
  recipe: Recipe;
  onClick: () => void;
}) {
  const typeInfo = TYPE_INFO[recipe.type] ?? TYPE_INFO.other;
  const ingredients = recipe.ingredients.slice(0, 4);
  const remaining = Math.max(0, recipe.ingredients.length - 4);

  return (
    <div
      className="index-card card-stack card-enter overflow-hidden flex flex-col"
      style={{ height: 240 }}
      onClick={onClick}
    >
      <div className="card-header-line px-6 pt-4 pb-2.5 flex items-start justify-between gap-3 shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="handwritten text-2xl font-bold text-ink leading-tight truncate">
            {recipe.name}
          </h2>
          <p className="handwritten text-base text-ink-light mt-0.5 truncate">
            {[
              recipe.author,
              recipe.cuisine,
              recipe.time_estimate_minutes
                ? `${recipe.time_estimate_minutes} min`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div
          style={{
            background: typeInfo.bg,
            color: typeInfo.text,
            padding: "2px 9px",
            borderRadius: 12,
            fontSize: 11,
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            flexShrink: 0,
            marginTop: 3,
          }}
        >
          {typeInfo.label}
        </div>
      </div>

      <div className="lined-card py-3 pr-6 flex-1 overflow-hidden">
        {ingredients.length > 0 ? (
          <ul className="space-y-0.5">
            {ingredients.map((ing, i) => (
              <li key={i} className="handwritten text-base text-ink flex gap-1.5">
                <span className="text-ink-blue font-semibold shrink-0 text-sm">
                  {[
                    ing.quantity != null ? String(ing.quantity) : "",
                    ing.units ?? "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </span>
                <span className="truncate">{ing.name}</span>
              </li>
            ))}
            {remaining > 0 && (
              <li className="handwritten text-sm text-ink-light/60 italic">
                +{remaining} more...
              </li>
            )}
          </ul>
        ) : (
          <p className="handwritten text-base text-ink-light/60 italic">
            No ingredients listed
          </p>
        )}
      </div>

      <div className="px-6 py-2 shrink-0 text-right border-t border-cream-dark/40">
        <span className="handwritten text-sm text-ink-light/50">
          tap to view full recipe →
        </span>
      </div>
    </div>
  );
}

function CardBrowser({
  recipes,
  loading,
  onSelectRecipe,
  view,
  setView,
  search,
  setSearch,
}: {
  recipes: readonly Recipe[];
  loading: boolean;
  onSelectRecipe: (r: Recipe) => void;
  view: "box" | "browse";
  setView: (v: "box" | "browse") => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardKey, setCardKey] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    setCardKey((k) => k + 1);
  }, [recipes]);

  const goNext = useCallback(() => {
    if (currentIndex < recipes.length - 1) {
      setCurrentIndex((i) => i + 1);
      setCardKey((k) => k + 1);
    }
  }, [currentIndex, recipes.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setCardKey((k) => k + 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  const currentRecipe = recipes[currentIndex];

  return (
    <div className="w-full open-reveal">
      {/* Controls */}
      <div className="flex gap-2 mb-5">
        <div className="flex gap-1 bg-cream-dark rounded-xl p-1 shrink-0">
          <button
            onClick={() => setView("box")}
            className={`px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all cursor-pointer ${
              view === "box"
                ? "bg-card text-ink shadow-sm"
                : "text-ink-light hover:text-ink"
            }`}
          >
            My Box
          </button>
          <button
            onClick={() => setView("browse")}
            className={`px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all cursor-pointer ${
              view === "browse"
                ? "bg-card text-ink shadow-sm"
                : "text-ink-light hover:text-ink"
            }`}
          >
            Browse
          </button>
        </div>
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-cream-dark bg-card text-ink placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-cardboard font-body shadow-sm text-sm"
          />
        </div>
      </div>

      {/* Card */}
      {loading ? (
        <div
          className="index-card overflow-hidden flex items-center justify-center"
          style={{ height: 240 }}
        >
          <p className="handwritten text-xl text-ink-light">
            Opening the box...
          </p>
        </div>
      ) : recipes.length === 0 ? (
        <div
          className="index-card overflow-hidden flex items-center justify-center"
          style={{ height: 240 }}
        >
          <p className="handwritten text-xl text-ink-light">
            {search ? "No recipes match your search" : "No recipes yet"}
          </p>
        </div>
      ) : (
        <RecipeSummaryCard
          key={`${currentRecipe.id}-${cardKey}`}
          recipe={currentRecipe}
          onClick={() => onSelectRecipe(currentRecipe)}
        />
      )}

      {/* Navigation */}
      {!loading && recipes.length > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-cream-dark text-ink font-body text-sm font-medium disabled:opacity-30 hover:bg-cream-dark transition-colors cursor-pointer disabled:cursor-default"
          >
            ← Prev
          </button>
          <span className="handwritten text-base text-ink-light">
            {currentIndex + 1} / {recipes.length}
          </span>
          <button
            onClick={goNext}
            disabled={currentIndex >= recipes.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-cream-dark text-ink font-body text-sm font-medium disabled:opacity-30 hover:bg-cream-dark transition-colors cursor-pointer disabled:cursor-default"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function RecipeBox({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [recipes, setRecipes] = useState<readonly Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<"box" | "browse">("box");
  const [boxOpen, setBoxOpen] = useState(false);
  const [boxOpening, setBoxOpening] = useState(false);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const fetchRecipes = useCallback(
    async (searchQuery: string, onlyUser: boolean) => {
      const { data } = await api.GET("/recipes", {
        headers: authHeaders,
        params: {
          query: {
            search: searchQuery || undefined,
            only_user: onlyUser,
          },
        },
      });
      if (data) setRecipes(data);
      setLoading(false);
    },
    [authHeaders],
  );

  useEffect(() => {
    setLoading(true);
    setRecipes([]);
    setSearch("");
    setDebouncedSearch("");
    fetchRecipes("", view === "box");
  }, [fetchRecipes, view]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  useEffect(() => {
    fetchRecipes(debouncedSearch, view === "box");
  }, [debouncedSearch, fetchRecipes, view]);

  const handleOpenBox = useCallback(() => {
    setBoxOpening(true);
    setTimeout(() => {
      setBoxOpen(true);
      setBoxOpening(false);
    }, 700);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-cream flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg flex items-center justify-between mb-8">
          <h1 className="handwritten text-4xl font-bold text-ink">
            Recipe Box
          </h1>
          <div className="flex items-center gap-4">
            {boxOpen && (
              <button
                onClick={() => setBoxOpen(false)}
                className="text-sm text-ink-light hover:text-ink transition-colors font-body cursor-pointer"
              >
                Close box
              </button>
            )}
            <button
              onClick={onLogout}
              className="text-sm text-ink-light hover:text-accent transition-colors font-body cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>

        {!boxOpen ? (
          <div className="flex flex-col items-center gap-8 flex-1 justify-center mt-8">
            <div className={boxOpening ? "" : "box-float"}>
              <BoxIllustration isOpen={boxOpening} onOpen={handleOpenBox} />
            </div>
            {!boxOpening && (
              <p className="handwritten text-xl text-ink-light/70 select-none">
                click to open
              </p>
            )}
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <CardBrowser
              recipes={recipes}
              loading={loading}
              onSelectRecipe={setSelectedRecipe}
              view={view}
              setView={setView}
              search={search}
              setSearch={setSearch}
            />
          </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeCard
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
}

export function App() {
  const [token, setToken] = useState<string | null>(() => {
    const t = getStoredToken();
    if (t && !isTokenExpired(t)) return t;
    clearToken();
    return null;
  });

  const handleLogout = () => {
    clearToken();
    setToken(null);
  };

  if (!token) {
    return <AuthScreen onAuth={setToken} />;
  }

  return <RecipeBox token={token} onLogout={handleLogout} />;
}
