"use client";

/* 3D tilt card — ported from the Aceternity / 21st.dev "3d-card-effect" to this
   project's idiom (CSS Modules + inline transforms, no Tailwind/cn-classes for
   the structural bits). The mouse-tilt + per-item depth logic is unchanged;
   only the styling hooks differ. Honors prefers-reduced-motion (no tilt). */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined);

function prefersReduced() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function CardContainer({
  children,
  className,
  containerClassName,
  style,
}: {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  style?: CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || prefersReduced()) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 22;
    const y = (e.clientY - top - height / 2) / 22;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
    // Normalized pointer position [0..1] for holo-glare layers — children can
    // drive gradient positions off these without their own mouse handlers.
    const mx = (e.clientX - left) / width;
    const my = (e.clientY - top) / height;
    containerRef.current.style.setProperty("--tilt-mx", mx.toFixed(3));
    containerRef.current.style.setProperty("--tilt-my", my.toFixed(3));
  };
  const handleMouseEnter = () => setIsMouseEntered(true);
  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    setIsMouseEntered(false);
    containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
    containerRef.current.style.setProperty("--tilt-mx", "0.5");
    containerRef.current.style.setProperty("--tilt-my", "0.5");
  };

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={containerClassName}
        style={{ perspective: "1200px", display: "flex", alignItems: "center", justifyContent: "center", ...style }}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={className}
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 200ms ease-out",
            position: "relative",
          }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
}

export function CardBody({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={{ transformStyle: "preserve-3d", ...style }}>
      {children}
    </div>
  );
}

type CardItemProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
  style?: CSSProperties;
  [key: string]: unknown;
};

export function CardItem({
  as: Tag = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  style,
  ...rest
}: CardItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isMouseEntered] = useMouseEnter();

  const apply = useCallback(() => {
    if (!ref.current) return;
    if (isMouseEntered && !prefersReduced()) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    } else {
      ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
    }
  }, [isMouseEntered, translateX, translateY, translateZ, rotateX, rotateY, rotateZ]);

  useEffect(() => { apply(); }, [apply]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ transition: "transform 200ms ease-out", willChange: "transform", ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function useMouseEnter() {
  const context = useContext(MouseEnterContext);
  if (context === undefined) {
    throw new Error("useMouseEnter must be used within a CardContainer");
  }
  return context;
}
