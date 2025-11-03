import React from "react";
import FitTwoLines from "@/components/FitTwoLines";

export function CategoryCard({ icon, title, onClick, className = "", onTitleFit, unifiedSize }: {
    icon: React.ReactNode;
    title: string;
    onClick?: () => void;
    className?: string;
    onTitleFit?: (size: number) => void;
    unifiedSize?: number | null;
}) {
    return (
        <button
            onClick={onClick}
            aria-label={title}
            className={
                "category-card relative rounded-2xl border border-border bg-card aspect-square overflow-hidden glow-card transition-transform hover:scale-[1.01] min-w-0 " +
                className
            }
            type="button"
        >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2.5 gap-2 min-w-0">
                <div className="opacity-90 mb-2">{icon}</div>
                <FitTwoLines
                    text={title}
                    onFit={onTitleFit}
                    forcedSize={unifiedSize ?? null}
                    className="block mx-auto text-center font-medium text-foreground w-[88%] max-w-[88%] leading-tight tracking-normal dark:text-white"
                    min={9}
                    max={11}
                    xsMin={8}
                    xsMax={10}
                />
            </div>
        </button>
    );
}

export default CategoryCard;
