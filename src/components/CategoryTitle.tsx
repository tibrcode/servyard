import React from "react";

function splitTitleSmart(title: string): [string, string] {
  const t = title.trim().replace(/\s+/g, " ");

  // If there's an ampersand, decide which side gets it based on shorter adjacent word
  const ampIdx = t.indexOf("&");
  if (ampIdx !== -1) {
    const leftPart = t.slice(0, ampIdx).trim();
    const rightPart = t.slice(ampIdx + 1).trim();

    const leftWords = leftPart.split(" ").filter(Boolean);
    const rightWords = rightPart.split(" ").filter(Boolean);
    const leftWord = leftWords[leftWords.length - 1] || "";
    const rightWord = rightWords[0] || "";

    if (leftPart && rightPart) {
      if (leftWord.length <= rightWord.length) {
        // Attach '&' to LEFT (e.g., "Marketing &" / "Advertising")
        return [`${leftPart} &`, rightPart];
      } else {
        // Attach '&' to RIGHT (e.g., "AI" / "& Data")
        return [leftPart, `& ${rightPart}`];
      }
    }
  }

  // No '&' or fallback balancing by word count
  const words = t.split(" ").filter(Boolean);
  if (words.length === 1) return [t, ""];
  if (words.length === 2) return [words[0], words[1]];

  const mid = Math.round(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export default function CategoryTitle({
  title,
  className = "",
  min = 12,
  max = 16,
}: {
  title: string;
  className?: string;
  /** optional: min/max font sizes (px) via CSS clamp */
  min?: number;
  max?: number;
}) {
  const [l1, l2] = splitTitleSmart(title);
  return (
    <div
      className={`cat-title text-center font-medium leading-snug ${className}`}
      style={{
        // Responsive font size (no wrapping inside a word)
        fontSize: `clamp(${min}px, 3.2vw, ${max}px)`,
        // keep words intact, but allow wrapping at spaces
        wordBreak: "keep-all",
        whiteSpace: "normal",
        overflowWrap: "break-word",
      }}
      title={title}
    >
      <span className="block whitespace-normal">{l1}</span>
      {l2 ? <span className="block whitespace-normal">{l2}</span> : null}
    </div>
  );
}
