import * as React from "react";
import { useState, useEffect } from "react";

interface ReactCardFlipProps {
  isFlipped: boolean;
  flipDirection?: "horizontal" | "vertical";
  flipSpeedFrontToBack?: number;
  flipSpeedBackToFront?: number;
  infinite?: boolean;
  cardZIndex?: string;
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  cardStyles?: { front?: React.CSSProperties; back?: React.CSSProperties };
  children: [React.ReactNode, React.ReactNode];
}

const ReactCardFlip: React.FC<ReactCardFlipProps> = (props) => {
  const {
    cardStyles: { back = {}, front = {} } = {},
    cardZIndex = "auto",
    containerStyle = {},
    containerClassName,
    flipDirection = "horizontal",
    flipSpeedFrontToBack = 0.6,
    flipSpeedBackToFront = 0.6,
    infinite = false,
    isFlipped = false,
  } = props;

  const [isFlippedState, setFlipped] = useState(isFlipped);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isFlipped !== isFlippedState) {
      setFlipped(isFlipped);
      setRotation((c) => c + 180);
    }
  }, [isFlipped]);

  const frontRotateY = `rotateY(${infinite ? rotation : isFlipped ? 180 : 0}deg)`;
  const backRotateY = `rotateY(${infinite ? rotation + 180 : isFlipped ? 0 : -180}deg)`;
  const frontRotateX = `rotateX(${infinite ? rotation : isFlipped ? 180 : 0}deg)`;
  const backRotateX = `rotateX(${infinite ? rotation + 180 : isFlipped ? 0 : -180}deg)`;

  const styles = {
    back: {
      WebkitBackfaceVisibility: "hidden" as const,
      backfaceVisibility: "hidden" as const,
      height: "100%",
      left: "0",
      position: isFlipped ? ("relative" as const) : ("absolute" as const),
      top: "0",
      transform: flipDirection === "horizontal" ? backRotateY : backRotateX,
      transformStyle: "preserve-3d" as const,
      transition: `${flipSpeedFrontToBack}s`,
      width: "100%",
      zIndex: isFlipped ? 2 : 1,
      ...back,
    },
    container: {
      zIndex: cardZIndex,
    },
    flipper: {
      height: "100%",
      perspective: "1000px",
      position: "relative" as const,
      width: "100%",
    },
    front: {
      WebkitBackfaceVisibility: "hidden" as const,
      backfaceVisibility: "hidden" as const,
      height: "100%",
      left: "0",
      position: isFlipped ? ("absolute" as const) : ("relative" as const),
      top: "0",
      transform: flipDirection === "horizontal" ? frontRotateY : frontRotateX,
      transformStyle: "preserve-3d" as const,
      transition: `${flipSpeedBackToFront}s`,
      width: "100%",
      zIndex: 2,
      ...front,
    },
  };

  const className = containerClassName
    ? `react-card-flip ${containerClassName}`
    : "react-card-flip";

  return (
    <div className={className} style={{ ...styles.container, ...containerStyle }}>
      <div className="react-card-flipper" style={styles.flipper}>
        <div className="react-card-front" style={styles.front}>
          {props.children[0]}
        </div>
        <div className="react-card-back" style={styles.back}>
          {props.children[1]}
        </div>
      </div>
    </div>
  );
};

export default ReactCardFlip;
