import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circle" | "rect";
  className?: string;
  count?: number;
}

/**
 * Primitive Skeleton component for render orchestration.
 * Use this to compose specialized placeholders (TableSkeleton, CardSkeleton, etc.)
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = "rect",
  className = "",
  count = 1,
}) => {
  const baseStyle: React.CSSProperties = {
    width: width || "100%",
    height: height || (variant === "text" ? "1em" : "100%"),
    backgroundColor: "rgba(229, 231, 235, 0.5)", // gray-200 with opacity
    borderRadius: variant === "circle" ? "50%" : variant === "text" ? "0.25rem" : "0.5rem",
    display: "block",
  };

  const skeletons = Array.from({ length: count }).map((_, i) => (
    <span
      key={i}
      className={`animate-pulse ${className} dark:bg-gray-700/50`}
      style={baseStyle}
      aria-hidden="true"
    />
  ));

  return count > 1 ? <div className="space-y-2 w-full">{skeletons}</div> : <>{skeletons[0]}</>;
};

export default Skeleton;
