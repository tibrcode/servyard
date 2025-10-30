import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** يقسم العنوان لسطرين بدون تقطيع كلمات.
 *  لو وُجد '&' تُربط تلقائيًا مع الكلمة الأقصر (قبلها/بعدها).
 */
function splitTwoLines(text: string): [string, string] {
  const t = text.trim().replace(/\s+/g, " ");
  const amp = t.indexOf("&");
  if (amp !== -1) {
    const leftPart = t.slice(0, amp).trim();
    const rightPart = t.slice(amp + 1).trim();
    const lw = leftPart.split(" ").filter(Boolean).pop() || "";
    const rw = rightPart.split(" ").filter(Boolean)[0] || "";
    if (lw.length <= rw.length) return [`${leftPart} &`.trim(), rightPart];
    return [leftPart, `& ${rightPart}`.trim()];
  }
  const words = t.split(" ").filter(Boolean);
  if (words.length <= 2) return [words[0] || "", words[1] || ""];
  const mid = Math.round(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

type Props = {
  text: string;
  className?: string;
  /** حجم خط أدنى/أقصى للوضع الاعتيادي (px) */
  min?: number;
  max?: number;
  /** حدود أصغر مخصّصة للشاشات الصغيرة جدًا ≤360px (px) */
  xsMin?: number;
  xsMax?: number;
  /** إبلاغ الحجم الأنسب للأعلى */
  onFit?: (size: number) => void;
  /** فرض حجم موحّد لكل البطاقات وتجاوز القياس */
  forcedSize?: number | null;
};

export default function FitTwoLines({
  text,
  className = "",
  min = 9,
  max = 11,
  xsMin = 8,
  xsMax = 10,
  onFit,
  forcedSize = null,
}: Props) {
  const [size, setSize] = useState(max);
  const [isXS, setIsXS] = useState(false); // <= 360px
  const wrapRef = useRef<HTMLDivElement>(null);
  const l1Ref = useRef<HTMLDivElement>(null);
  const l2Ref = useRef<HTMLDivElement>(null);
  const [l1, l2] = useMemo(() => splitTwoLines(text), [text]);

  // راقب حجم الشاشة لتفعيل حدود أصغر على الشاشات الصغيرة جدًا
  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mq = window.matchMedia("(max-width: 360px)");
    const update = () => setIsXS(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // قياس وتحديد حجم الخط بالبحث الثنائي ضمن الحدود المناسبة
  useLayoutEffect(() => {
    const applyFinal = (wrap: HTMLDivElement, s: number) => {
      // تقليص 30% على الشاشات الضيقة (وسّعنا العتبة إلى ≤ 540px لتغطية أجهزة أعرض)
      const isNarrow = typeof window !== 'undefined' && 'matchMedia' in window
        ? window.matchMedia('(max-width: 540px)').matches
        : false;
      let finalPx = Math.max(1, Math.floor(s * (isNarrow ? 0.7 : 1)));
      wrap.style.fontSize = `${finalPx}px`;
      // حل عبقري: تأكد من وجود هامش عرضي مريح بعد التصغير
      const a = l1Ref.current;
      const b = l2Ref.current;
      const marginFactor = 0.94; // اترك ~6% هامش داخل الإطار
      let tries = 0;
      const w = wrap.clientWidth || 0;
      while (
        tries < 12 &&
        w > 0 &&
        ((a && a.scrollWidth > w * marginFactor) || (b && b.textContent?.trim() && b.scrollWidth > w * marginFactor))
      ) {
        finalPx = Math.max(6, finalPx - 1); // لا ننزل أقل من 6px
        wrap.style.fontSize = `${finalPx}px`;
        tries++;
      }
      setSize(finalPx);
      onFit?.(finalPx);
    };

    if (forcedSize != null) {
      const wrapForced = wrapRef.current;
      if (wrapForced) applyFinal(wrapForced, forcedSize);
      return;
    }
    const wrap = wrapRef.current, a = l1Ref.current, b = l2Ref.current;
    if (!wrap || !a) return;

    const loInit = isXS ? xsMin : min;
    const hiInit = isXS ? xsMax : max;

    const measure = () => {
      // handle detached or zero-width containers by retrying next frame
      if (wrap.clientWidth === 0) {
        requestAnimationFrame(measure);
        return;
      }
      let lo = loInit, hi = hiInit, best = loInit;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        wrap.style.fontSize = `${mid}px`;
        const w = wrap.clientWidth;
        const okA = a.scrollWidth <= w + 0.5;
        const okB = !b?.textContent?.trim() || (b.scrollWidth <= w + 0.5);
        if (okA && okB) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
      }
      applyFinal(wrap, best);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    if (wrap.parentElement) ro.observe(wrap.parentElement);
    return () => ro.disconnect();
  }, [text, l1, l2, min, max, xsMin, xsMax, isXS, onFit, forcedSize]);

  return (
    <div
      ref={wrapRef}
      className={`cat-title ${className}`}
      style={{
        fontSize: `${size}px`,
        lineHeight: 1.25,
        wordBreak: "keep-all",     // لا تقطع داخل الكلمة
        overflowWrap: "break-word" // كسر عند المسافات فقط
      }}
    >
      <div ref={l1Ref} className="whitespace-nowrap">{l1}</div>
      {l2 ? <div ref={l2Ref} className="whitespace-nowrap">{l2}</div> : null}
    </div>
  );
}
