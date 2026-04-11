import { useId } from "react";
import type { ISvgProps } from "./types";

export function MainLogo({
  className,
  color = "#3DCBB1",
  width = 43,
  height = 43,
  outlineColor = "white",
}: ISvgProps) {
  const id = useId().replace(/:/g, "");
  const clipPathId = `main-logo-clip-${id}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 43 43"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath={`url(#${clipPathId})`}>
        <rect width="43" height="43" rx="21.5" fill={color} />
        <rect
          x="4.70312"
          y="4.70312"
          width="33.5938"
          height="33.5938"
          rx="16.7969"
          fill={color}
        />
        <path
          d="M29.7594 23.8086C34.2105 23.8086 36.9199 26.6728 36.9199 31.9367V43.7031H29.7594V32.9043C29.7594 31.5883 29.1401 30.6981 27.7854 30.6981C26.1211 30.6981 25.5018 32.0141 25.5018 33.5623V43.7031H18.3413V32.9043C18.3413 31.5883 17.722 30.6981 16.3673 30.6981C14.703 30.6981 14.0837 32.0141 14.0837 33.5623V43.7031H6.92322V24.3504H14.0837V26.1696C15.2062 24.7762 16.9866 23.8086 19.3476 23.8086C21.5539 23.8086 23.1795 24.6214 24.1858 26.2083C25.4244 24.7762 27.1661 23.8086 29.7594 23.8086Z"
          fill={outlineColor}
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="43" height="43" rx="21.5" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
