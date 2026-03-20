import React from "react";

const ICONS = {
  search: [
    { tag: "circle", props: { cx: 11, cy: 11, r: 7 } },
    { tag: "line", props: { x1: 21, y1: 21, x2: 16.65, y2: 16.65 } }
  ],
  mail: [
    { tag: "rect", props: { x: 3, y: 5, width: 18, height: 14, rx: 2, ry: 2 } },
    { tag: "polyline", props: { points: "3 7 12 13 21 7" } }
  ],
  smartphone: [
    { tag: "rect", props: { x: 7, y: 2, width: 10, height: 20, rx: 2, ry: 2 } },
    { tag: "line", props: { x1: 12, y1: 18, x2: 12.01, y2: 18 } }
  ],
  paperclip: [
    { tag: "path", props: { d: "M21 8v9a5 5 0 0 1-10 0V7a3 3 0 1 1 6 0v10a1 1 0 0 1-2 0V8" } }
  ],
  type: [
    { tag: "polyline", props: { points: "4 7 4 4 20 4 20 7" } },
    { tag: "line", props: { x1: 12, y1: 4, x2: 12, y2: 20 } },
    { tag: "line", props: { x1: 8, y1: 20, x2: 16, y2: 20 } }
  ],
  package: [
    { tag: "path", props: { d: "M21 8.5 12 13 3 8.5" } },
    { tag: "path", props: { d: "M3 8.5V17l9 4.5 9-4.5V8.5L12 4z" } },
    { tag: "line", props: { x1: 12, y1: 13, x2: 12, y2: 21.5 } }
  ],
  "graduation-cap": [
    { tag: "path", props: { d: "m2 9 10-5 10 5-10 5Z" } },
    { tag: "path", props: { d: "M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" } },
    { tag: "line", props: { x1: 22, y1: 9, x2: 22, y2: 15 } }
  ],
  target: [
    { tag: "circle", props: { cx: 12, cy: 12, r: 9 } },
    { tag: "circle", props: { cx: 12, cy: 12, r: 5 } },
    { tag: "circle", props: { cx: 12, cy: 12, r: 1.4, fill: "currentColor", stroke: "none" } }
  ],
  radar: [
    { tag: "circle", props: { cx: 12, cy: 12, r: 9 } },
    { tag: "circle", props: { cx: 12, cy: 12, r: 5 } },
    { tag: "path", props: { d: "M12 12 18.5 6.5" } },
    { tag: "path", props: { d: "M12 12a2 2 0 1 0 0.01 0" } }
  ],
  brain: [
    { tag: "path", props: { d: "M8 8a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0z" } },
    { tag: "path", props: { d: "M14 8a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0" } },
    { tag: "path", props: { d: "M8 10H6a3 3 0 0 0 0 6h2" } },
    { tag: "path", props: { d: "M14 12h2a3 3 0 0 1 0 6h-2" } }
  ],
  shield: [{ tag: "path", props: { d: "M12 3 4.5 6v6c0 5 3 8.8 7.5 10 4.5-1.2 7.5-5 7.5-10V6z" } }],
  "shield-check": [
    { tag: "path", props: { d: "M12 3 4.5 6v6c0 5 3 8.8 7.5 10 4.5-1.2 7.5-5 7.5-10V6z" } },
    { tag: "path", props: { d: "m9 12 2 2 4-4" } }
  ],
  moon: [{ tag: "path", props: { d: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" } }],
  sun: [
    { tag: "circle", props: { cx: 12, cy: 12, r: 4 } },
    { tag: "line", props: { x1: 12, y1: 2, x2: 12, y2: 5 } },
    { tag: "line", props: { x1: 12, y1: 19, x2: 12, y2: 22 } },
    { tag: "line", props: { x1: 2, y1: 12, x2: 5, y2: 12 } },
    { tag: "line", props: { x1: 19, y1: 12, x2: 22, y2: 12 } },
    { tag: "line", props: { x1: 4.9, y1: 4.9, x2: 7, y2: 7 } },
    { tag: "line", props: { x1: 17, y1: 17, x2: 19.1, y2: 19.1 } },
    { tag: "line", props: { x1: 4.9, y1: 19.1, x2: 7, y2: 17 } },
    { tag: "line", props: { x1: 17, y1: 7, x2: 19.1, y2: 4.9 } }
  ],
  menu: [
    { tag: "line", props: { x1: 3, y1: 6, x2: 21, y2: 6 } },
    { tag: "line", props: { x1: 3, y1: 12, x2: 21, y2: 12 } },
    { tag: "line", props: { x1: 3, y1: 18, x2: 21, y2: 18 } }
  ],
  globe: [
    { tag: "circle", props: { cx: 12, cy: 12, r: 9 } },
    { tag: "path", props: { d: "M3 12h18" } },
    { tag: "path", props: { d: "M12 3a15 15 0 0 1 0 18" } },
    { tag: "path", props: { d: "M12 3a15 15 0 0 0 0 18" } }
  ],
  "map-pin": [
    { tag: "path", props: { d: "M12 22s7-5.8 7-12a7 7 0 1 0-14 0c0 6.2 7 12 7 12z" } },
    { tag: "circle", props: { cx: 12, cy: 10, r: 2.6 } }
  ],
  building: [
    { tag: "rect", props: { x: 6, y: 3, width: 12, height: 18, rx: 1.5 } },
    { tag: "line", props: { x1: 10, y1: 7, x2: 10, y2: 7.01 } },
    { tag: "line", props: { x1: 14, y1: 7, x2: 14, y2: 7.01 } },
    { tag: "line", props: { x1: 10, y1: 11, x2: 10, y2: 11.01 } },
    { tag: "line", props: { x1: 14, y1: 11, x2: 14, y2: 11.01 } },
    { tag: "line", props: { x1: 10, y1: 15, x2: 10, y2: 15.01 } },
    { tag: "line", props: { x1: 14, y1: 15, x2: 14, y2: 15.01 } }
  ],
  server: [
    { tag: "rect", props: { x: 3, y: 4, width: 18, height: 6, rx: 1.5 } },
    { tag: "rect", props: { x: 3, y: 14, width: 18, height: 6, rx: 1.5 } },
    { tag: "line", props: { x1: 7, y1: 7, x2: 7.01, y2: 7 } },
    { tag: "line", props: { x1: 7, y1: 17, x2: 7.01, y2: 17 } }
  ],
  hash: [
    { tag: "line", props: { x1: 5, y1: 9, x2: 19, y2: 9 } },
    { tag: "line", props: { x1: 5, y1: 15, x2: 19, y2: 15 } },
    { tag: "line", props: { x1: 9, y1: 4, x2: 7, y2: 20 } },
    { tag: "line", props: { x1: 17, y1: 4, x2: 15, y2: 20 } }
  ],
  clipboard: [
    { tag: "rect", props: { x: 8, y: 3, width: 8, height: 4, rx: 1 } },
    { tag: "path", props: { d: "M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" } }
  ],
  calendar: [
    { tag: "rect", props: { x: 3, y: 5, width: 18, height: 16, rx: 2 } },
    { tag: "line", props: { x1: 8, y1: 3, x2: 8, y2: 7 } },
    { tag: "line", props: { x1: 16, y1: 3, x2: 16, y2: 7 } },
    { tag: "line", props: { x1: 3, y1: 11, x2: 21, y2: 11 } }
  ],
  clock: [
    { tag: "circle", props: { cx: 12, cy: 12, r: 9 } },
    { tag: "line", props: { x1: 12, y1: 7, x2: 12, y2: 12 } },
    { tag: "line", props: { x1: 12, y1: 12, x2: 15, y2: 14 } }
  ],
  "circle-alert": [
    { tag: "circle", props: { cx: 12, cy: 12, r: 9 } },
    { tag: "line", props: { x1: 12, y1: 8, x2: 12, y2: 13 } },
    { tag: "line", props: { x1: 12, y1: 16, x2: 12.01, y2: 16 } }
  ],
  "triangle-alert": [
    { tag: "path", props: { d: "m10.3 3.5-8.1 14a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3l-8.1-14a2 2 0 0 0-3.4 0Z" } },
    { tag: "line", props: { x1: 12, y1: 9, x2: 12, y2: 13 } },
    { tag: "line", props: { x1: 12, y1: 16, x2: 12.01, y2: 16 } }
  ],
  "check-circle": [
    { tag: "circle", props: { cx: 12, cy: 12, r: 9 } },
    { tag: "path", props: { d: "m8.5 12.5 2.3 2.4 4.7-5" } }
  ],
  "x-circle": [
    { tag: "circle", props: { cx: 12, cy: 12, r: 9 } },
    { tag: "line", props: { x1: 9, y1: 9, x2: 15, y2: 15 } },
    { tag: "line", props: { x1: 15, y1: 9, x2: 9, y2: 15 } }
  ],
  camera: [
    { tag: "rect", props: { x: 3, y: 7, width: 18, height: 13, rx: 2 } },
    { tag: "path", props: { d: "M9 7 10.5 4h3L15 7" } },
    { tag: "circle", props: { cx: 12, cy: 13.5, r: 3.5 } }
  ],
  rocket: [
    { tag: "path", props: { d: "M12 3c3.8 1.7 6.3 4.2 8 8-2.3.5-4.5.8-6.8 1.1L11.9 14c-.3 1.6-.6 3.2-1.1 4.8-3.8-1.7-6.3-4.2-8-8 2.3-.5 4.5-.8 6.8-1.1L12 3Z" } },
    { tag: "circle", props: { cx: 13.2, cy: 10.8, r: 1.6 } },
    { tag: "path", props: { d: "M7 17 4 20l1.8-4.8" } }
  ],
  info: [
    { tag: "circle", props: { cx: 12, cy: 12, r: 9 } },
    { tag: "line", props: { x1: 12, y1: 11, x2: 12, y2: 16 } },
    { tag: "line", props: { x1: 12, y1: 8, x2: 12.01, y2: 8 } }
  ],
  x: [
    { tag: "line", props: { x1: 18, y1: 6, x2: 6, y2: 18 } },
    { tag: "line", props: { x1: 6, y1: 6, x2: 18, y2: 18 } }
  ],
  star: [
    {
      tag: "path",
      props: {
        d: "m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20l1.1-6.2L3 9.4l6.2-.9z",
        fill: "currentColor",
        stroke: "none"
      }
    }
  ],
  "star-outline": [{ tag: "path", props: { d: "m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20l1.1-6.2L3 9.4l6.2-.9z" } }],
  lightbulb: [
    { tag: "path", props: { d: "M9 18h6" } },
    { tag: "path", props: { d: "M10 21h4" } },
    { tag: "path", props: { d: "M12 3a6 6 0 0 0-3.8 10.7c1 .8 1.8 1.8 1.8 3.1h4c0-1.3.8-2.3 1.8-3.1A6 6 0 0 0 12 3z" } }
  ],
  flame: [
    { tag: "path", props: { d: "M12 3c2.5 3.2 1.1 5.2-.3 6.6-1.1 1-2.4 1.7-2.4 3.6a2.7 2.7 0 0 0 5.4 0c0-1.4-.9-2.2-1.7-3 .2 1.8-1.2 2.8-2.3 2.8-1.5 0-2.7-1.3-2.7-2.8C8 8.1 9.4 7.1 10.8 5.8 11.7 5 12.3 4 12 3z" } }
  ],
  trophy: [
    { tag: "path", props: { d: "M7 4h10v3a5 5 0 0 1-10 0z" } },
    { tag: "path", props: { d: "M7 6H5a2 2 0 0 0 0 4h2" } },
    { tag: "path", props: { d: "M17 6h2a2 2 0 0 1 0 4h-2" } },
    { tag: "path", props: { d: "M12 12v4" } },
    { tag: "path", props: { d: "M9 20h6" } }
  ],
  "chevron-right": [{ tag: "polyline", props: { points: "9 6 15 12 9 18" } }]
};

const DEFAULT_ICON = [{ tag: "circle", props: { cx: 12, cy: 12, r: 9 } }];

export function Icon({ name, size = 16, color = "currentColor", strokeWidth = 2, style, title }) {
  const shapes = ICONS[name] || DEFAULT_ICON;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
    >
      {title && <title>{title}</title>}
      {shapes.map((shape, idx) => {
        const { tag, props } = shape;
        return React.createElement(tag, {
          key: `${name}-${idx}`,
          ...props,
          stroke: props?.stroke || (props?.fill === "currentColor" ? "none" : color),
          fill: props?.fill || "none"
        });
      })}
    </svg>
  );
}
