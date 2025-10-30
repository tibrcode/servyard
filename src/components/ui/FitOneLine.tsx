import React, { useLayoutEffect, useRef, useState } from "react";

/**
 * Shrinks text to always fit on ONE line within its container.
 * Uses a binary search between min/max font sizes and ResizeObserver for reflow.
 */
export default function FitOneLine({
    children,
    max = 16, // px
    min = 10, // px
    className = "",
    style = {},
    title,
}: {
    children: string;
    max?: number;
    min?: number;
    className?: string;
    style?: React.CSSProperties;
    title?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<number>(max);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const measure = () => {
            // guard if no width yet
            const cw = el.clientWidth;
            if (!cw || cw <= 0) {
                // try again on the next frame
                requestAnimationFrame(measure);
                return;
            }
            let lo = min;
            let hi = max;
            let best = min;

            // Ensure measurement baseline
            el.style.whiteSpace = "nowrap";

            while (lo <= hi) {
                const mid = Math.floor((lo + hi) / 2);
                el.style.fontSize = `${mid}px`;
                const fits = el.scrollWidth <= el.clientWidth + 0.5; // tolerance
                if (fits) {
                    best = mid;
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }

            setSize(best);
        };

    // Initial measure
    measure();

        const ro = new ResizeObserver(() => {
            measure();
        });

        ro.observe(el);
        if (el.parentElement) ro.observe(el.parentElement);

        return () => {
            ro.disconnect();
        };
    }, [min, max, children]);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                ...style,
                fontSize: `${size}px`,
                whiteSpace: "nowrap",
            }}
            title={title ?? children}
        >
            {children}
        </div>
    );
}
