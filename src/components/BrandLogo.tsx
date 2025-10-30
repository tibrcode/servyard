import React from "react";
import logoPng from "@/assets/servyard-logo.png";

interface BrandLogoProps {
    className?: string;
    height?: number; // pixel height
    alt?: string;
    useImage?: boolean; // prefer image asset (PNG/SVG). Defaults to true.
}

/**
 * BrandLogo
 * Inline SVG wordmark with transparent background. Uses currentColor for fill,
 * so the brand color can be controlled via CSS (e.g., text-primary).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "text-primary", height = 44, alt = "ServYard", useImage = true }) => {
    const [imgFailed, setImgFailed] = React.useState(false);
    const h = typeof height === 'number' ? `${height}px` : height;

    if (useImage && !imgFailed) {
        return (
            <img
                src={logoPng}
                alt={alt}
                height={height}
                style={{ height, width: "auto" }}
                className={`block select-none pointer-events-none ${className}`}
                draggable={false}
                onError={() => setImgFailed(true)}
            />
        );
    }

    // Fallback inline SVG wordmark (transparent, themable via currentColor)
    return (
        <span className={`inline-flex items-center leading-none ${className}`} aria-label={alt} role="img">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 800 200"
                width="auto"
                height={h}
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
                className="block select-none"
            >
                <text x="0" y="145" fontFamily="Poppins, Inter, system-ui, -apple-system, Segoe UI, Roboto" fontWeight="800" fontSize="140">Serv</text>
                <text x="360" y="145" fontFamily="Poppins, Inter, system-ui, -apple-system, Segoe UI, Roboto" fontWeight="800" fontSize="140">Yard</text>
            </svg>
        </span>
    );
};

export default BrandLogo;
