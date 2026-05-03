import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, RoundedBox, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { components } from "./lib/api/v1";

type Recipe = components["schemas"]["src__schemas__Recipe"];

// ── Constants ──

const BOX_WIDTH = 5;
const BOX_DEPTH = 3.5;
const BOX_HEIGHT = 2.8;
const WALL_THICKNESS = 0.15;
const CARD_WIDTH = BOX_WIDTH - WALL_THICKNESS * 2 - 0.3;
const CARD_HEIGHT = BOX_HEIGHT - 0.3;
const CARD_DEPTH = 0.02;
const DIVIDER_DEPTH = 0.04;
const DIVIDER_TAB_HEIGHT = 0.45;

const WOOD_DARK = "#4a2f1e";
const WOOD_MID = "#5c3d2e";
const WOOD_LIGHT = "#7a5740";
const CARD_COLOR = "#fffef9";
const CARD_AGED = "#f7f0df";
const DIVIDER_COLOR = "#e8ddd0";
const DIVIDER_TAB_COLOR = "#dcc5a0";
const MARGIN_RED = "#d4736c";
const INK_COLOR = "#2c1810";
const INK_LIGHT = "#5a4a3f";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ── Wood material ──

function WoodMaterial({ color, darker }: { color: string; darker?: boolean }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.85}
      metalness={0.02}
      envMapIntensity={0.3}
      {...(darker ? { emissive: "#000000", emissiveIntensity: 0.05 } : {})}
    />
  );
}

// ── The wooden box shell ──

function WoodenBox() {
  const innerWidth = BOX_WIDTH - WALL_THICKNESS * 2;
  const innerDepth = BOX_DEPTH - WALL_THICKNESS * 2;

  return (
    <group>
      {/* Bottom */}
      <RoundedBox
        args={[BOX_WIDTH, WALL_THICKNESS, BOX_DEPTH]}
        radius={0.03}
        position={[0, -BOX_HEIGHT / 2, 0]}
      >
        <WoodMaterial color={WOOD_DARK} darker />
      </RoundedBox>

      {/* Back wall */}
      <RoundedBox
        args={[BOX_WIDTH, BOX_HEIGHT, WALL_THICKNESS]}
        radius={0.03}
        position={[0, 0, -BOX_DEPTH / 2 + WALL_THICKNESS / 2]}
      >
        <WoodMaterial color={WOOD_MID} />
      </RoundedBox>

      {/* Front wall */}
      <RoundedBox
        args={[BOX_WIDTH, BOX_HEIGHT * 0.7, WALL_THICKNESS]}
        radius={0.03}
        position={[0, -BOX_HEIGHT * 0.15, BOX_DEPTH / 2 - WALL_THICKNESS / 2]}
      >
        <WoodMaterial color={WOOD_LIGHT} />
      </RoundedBox>

      {/* Label plate on front */}
      <group position={[0, -BOX_HEIGHT * 0.15, BOX_DEPTH / 2 - WALL_THICKNESS / 2 + 0.08]}>
        <RoundedBox args={[1.4, 0.55, 0.03]} radius={0.02}>
          <meshStandardMaterial color="#c0b8a8" metalness={0.4} roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[1.15, 0.35]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <Text
          position={[0, 0, 0.04]}
          fontSize={0.18}
          color={INK_LIGHT}
          font="/fonts/Caveat-Regular.ttf"
          anchorX="center"
          anchorY="middle"
        >
          recipes
        </Text>
        {/* Screws */}
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 0, 0.02]}>
            <circleGeometry args={[0.04, 16]} />
            <meshStandardMaterial color="#a09888" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Left wall */}
      <RoundedBox
        args={[WALL_THICKNESS, BOX_HEIGHT, BOX_DEPTH]}
        radius={0.03}
        position={[-BOX_WIDTH / 2 + WALL_THICKNESS / 2, 0, 0]}
      >
        <WoodMaterial color={WOOD_MID} />
      </RoundedBox>

      {/* Right wall */}
      <RoundedBox
        args={[WALL_THICKNESS, BOX_HEIGHT, BOX_DEPTH]}
        radius={0.03}
        position={[BOX_WIDTH / 2 - WALL_THICKNESS / 2, 0, 0]}
      >
        <WoodMaterial color={WOOD_MID} />
      </RoundedBox>

      {/* Interior shadow plane (bottom darkening) */}
      <mesh
        position={[0, -BOX_HEIGHT / 2 + WALL_THICKNESS / 2 + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[innerWidth, innerDepth]} />
        <meshStandardMaterial
          color={WOOD_DARK}
          roughness={1}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

// ── A single recipe card standing in the box ──

function RecipeCardMesh({
  recipe,
  positionZ,
  onClick,
  isHovered,
  onHover,
  onUnhover,
}: {
  recipe: Recipe;
  positionZ: number;
  onClick: () => void;
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const targetY = isHovered ? 0.4 : 0;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        delta * 8
      );
    }
  });

  return (
    <group
      ref={meshRef}
      position={[0, 0, positionZ]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onUnhover();
        document.body.style.cursor = "auto";
      }}
    >
      {/* Card body */}
      <RoundedBox
        args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]}
        radius={0.01}
      >
        <meshStandardMaterial
          color={CARD_COLOR}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </RoundedBox>

      {/* Red margin line */}
      <mesh position={[-CARD_WIDTH / 2 + 0.5, 0, CARD_DEPTH / 2 + 0.001]}>
        <planeGeometry args={[0.015, CARD_HEIGHT - 0.1]} />
        <meshBasicMaterial color={MARGIN_RED} />
      </mesh>

      {/* Horizontal lines */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          position={[0, CARD_HEIGHT / 2 - 0.6 - i * 0.28, CARD_DEPTH / 2 + 0.001]}
        >
          <planeGeometry args={[CARD_WIDTH - 0.2, 0.005]} />
          <meshBasicMaterial color="#c8d8ea" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Recipe name text */}
      <Text
        position={[-CARD_WIDTH / 2 + 0.7, CARD_HEIGHT / 2 - 0.35, CARD_DEPTH / 2 + 0.005]}
        fontSize={0.22}
        maxWidth={CARD_WIDTH - 1.2}
        color={INK_COLOR}
        font="/fonts/Caveat-Regular.ttf"
        anchorX="left"
        anchorY="middle"
        fontWeight="bold"
      >
        {recipe.name}
      </Text>

      {/* Author / meta */}
      <Text
        position={[-CARD_WIDTH / 2 + 0.7, CARD_HEIGHT / 2 - 0.65, CARD_DEPTH / 2 + 0.005]}
        fontSize={0.14}
        maxWidth={CARD_WIDTH - 1.2}
        color={INK_LIGHT}
        font="/fonts/Caveat-Regular.ttf"
        anchorX="left"
        anchorY="middle"
      >
        {[recipe.author, recipe.cuisine, recipe.time_estimate_minutes ? `${recipe.time_estimate_minutes} min` : ""].filter(Boolean).join(" \u00b7 ")}
      </Text>
    </group>
  );
}

// ── Letter divider tab ──

function DividerTab({
  letter,
  positionZ,
  tabOffset,
  hasRecipes,
  onClick,
}: {
  letter: string;
  positionZ: number;
  tabOffset: number;
  hasRecipes: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[0, 0, positionZ]}>
      {/* Divider card body */}
      <RoundedBox
        args={[CARD_WIDTH, CARD_HEIGHT, DIVIDER_DEPTH]}
        radius={0.01}
      >
        <meshStandardMaterial
          color={DIVIDER_COLOR}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </RoundedBox>

      {/* Tab sticking up */}
      <group position={[tabOffset, CARD_HEIGHT / 2 + DIVIDER_TAB_HEIGHT / 2, 0]}>
        <RoundedBox
          args={[0.55, DIVIDER_TAB_HEIGHT, DIVIDER_DEPTH]}
          radius={0.04}
          onClick={(e) => {
            if (hasRecipes) {
              e.stopPropagation();
              onClick();
            }
          }}
          onPointerOver={(e) => {
            if (hasRecipes) {
              e.stopPropagation();
              setHovered(true);
              document.body.style.cursor = "pointer";
            }
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <meshStandardMaterial
            color={hovered && hasRecipes ? "#c9a96e" : DIVIDER_TAB_COLOR}
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </RoundedBox>
        <Text
          position={[0, 0.02, DIVIDER_DEPTH / 2 + 0.002]}
          fontSize={0.24}
          color={hasRecipes ? INK_COLOR : INK_LIGHT + "60"}
          font="/fonts/Caveat-Bold.ttf"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {letter}
        </Text>
      </group>
    </group>
  );
}

// ── Camera controller ──

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 4.5, 6);
    camera.lookAt(0, -0.5, 0);
  }, [camera]);

  return null;
}

// ── Scene content ──

function BoxScene({
  recipes,
  loading,
  search,
  view,
  onSelectRecipe,
}: {
  recipes: readonly Recipe[];
  loading: boolean;
  search: string;
  view: "box" | "browse";
  onSelectRecipe: (recipe: Recipe) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Group recipes by first letter
  const byLetter = useMemo(() => {
    const sorted = [...recipes].sort((a, b) => a.name.localeCompare(b.name));
    const groups: Record<string, Recipe[]> = {};
    for (const r of sorted) {
      const letter = r.name[0]?.toUpperCase() || "#";
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(r);
    }
    return groups;
  }, [recipes]);

  const activeLetters = useMemo(
    () => new Set(Object.keys(byLetter)),
    [byLetter]
  );

  // Position each card and divider along the Z axis (front to back of box)
  const items = useMemo(() => {
    const result: Array<
      | { type: "divider"; letter: string; z: number; tabOffset: number; hasRecipes: boolean }
      | { type: "card"; recipe: Recipe; z: number }
    > = [];

    const startZ = BOX_DEPTH / 2 - WALL_THICKNESS - 0.3;
    const spacing = 0.08;
    let currentZ = startZ;

    // Calculate tab positions to stagger them
    const tabPositions = ALPHABET.map((_, i) => {
      const cols = 5;
      const col = i % cols;
      const tabWidth = 0.55;
      const totalWidth = CARD_WIDTH - 0.6;
      const colSpacing = totalWidth / (cols - 1);
      return -totalWidth / 2 + col * colSpacing - tabWidth / 2 + tabWidth / 2;
    });

    for (let i = 0; i < ALPHABET.length; i++) {
      const letter = ALPHABET[i];
      const hasRecipes = activeLetters.has(letter);

      result.push({
        type: "divider",
        letter,
        z: currentZ,
        tabOffset: tabPositions[i],
        hasRecipes,
      });
      currentZ -= DIVIDER_DEPTH + spacing;

      if (byLetter[letter]) {
        for (const recipe of byLetter[letter]) {
          result.push({ type: "card", recipe, z: currentZ });
          currentZ -= CARD_DEPTH + spacing * 0.5;
        }
      }
    }

    return result;
  }, [byLetter, activeLetters]);

  // Animation ref for loading spin
  const loadingRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (loadingRef.current) {
      loadingRef.current.rotation.z -= delta * 3;
    }
  });

  return (
    <>
      <CameraSetup />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 8, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-2, 4, -3]} intensity={0.3} color="#ffe8cc" />
      <pointLight position={[0, 3, 4]} intensity={0.4} color="#fff5e6" />

      {/* Transparent background — blends with page */}

      {/* The box */}
      <WoodenBox />

      {/* Cards and dividers inside the box */}
      <group position={[0, -BOX_HEIGHT / 2 + CARD_HEIGHT / 2 + WALL_THICKNESS, 0]}>
        {loading ? (
          <mesh ref={loadingRef} position={[0, 0.5, 0]}>
            <torusGeometry args={[0.3, 0.05, 8, 32, Math.PI * 1.5]} />
            <meshStandardMaterial color={WOOD_LIGHT} />
          </mesh>
        ) : recipes.length === 0 ? (
          <Text
            position={[0, 0.3, 0.5]}
            fontSize={0.3}
            color={INK_LIGHT + "80"}
            font="/fonts/Caveat-Regular.ttf"
            anchorX="center"
            anchorY="middle"
          >
            {search
              ? "No recipes match your search"
              : view === "box"
                ? "Your box is empty"
                : "No recipes to browse yet"}
          </Text>
        ) : (
          items.map((item) => {
            if (item.type === "divider") {
              return (
                <DividerTab
                  key={`div-${item.letter}`}
                  letter={item.letter}
                  positionZ={item.z}
                  tabOffset={item.tabOffset}
                  hasRecipes={item.hasRecipes}
                  onClick={() => {}}
                />
              );
            } else {
              return (
                <RecipeCardMesh
                  key={item.recipe.id}
                  recipe={item.recipe}
                  positionZ={item.z}
                  onClick={() => onSelectRecipe(item.recipe)}
                  isHovered={hoveredId === item.recipe.id}
                  onHover={() => setHoveredId(item.recipe.id)}
                  onUnhover={() => setHoveredId(null)}
                />
              );
            }
          })
        )}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.48}
        minAzimuthAngle={-Math.PI * 0.25}
        maxAzimuthAngle={Math.PI * 0.25}
        minDistance={5}
        maxDistance={12}
        target={[0, -0.3, 0]}
      />
    </>
  );
}

// ── Exported component ──

export function RecipeBox3D({
  recipes,
  loading,
  search,
  view,
  onSelectRecipe,
}: {
  recipes: readonly Recipe[];
  loading: boolean;
  search: string;
  view: "box" | "browse";
  onSelectRecipe: (recipe: Recipe) => void;
}) {
  return (
    <div className="w-full max-w-3xl" style={{ height: "60vh" }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, alpha: true }}
        style={{ background: "transparent" }}
      >
        <BoxScene
          recipes={recipes}
          loading={loading}
          search={search}
          view={view}
          onSelectRecipe={onSelectRecipe}
        />
      </Canvas>
    </div>
  );
}
