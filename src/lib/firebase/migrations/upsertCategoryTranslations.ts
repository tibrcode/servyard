import { db } from "@/integrations/firebase/client";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { categoryTranslations, slugifyCategory } from "@/lib/categoriesLocale";
import { supportedLanguages } from "@/lib/languages";

type Result = {
    docsScanned: number;
    docsUpdated: number;
    fieldsUpdated: number;
};

export async function upsertCategoryTranslations(languageCodes?: string[]): Promise<Result> {
    const langs = (languageCodes && languageCodes.length > 0
        ? languageCodes
        : supportedLanguages.map((l) => l.code)
    ).filter(Boolean);

    // Ensure base languages are included
    for (const base of ["en", "ar", "fil"]) {
        if (!langs.includes(base)) langs.push(base);
    }

    const categoriesRef = collection(db, "service_categories");
    const snapshot = await getDocs(categoriesRef);

    let docsScanned = 0;
    let docsUpdated = 0;
    let fieldsUpdated = 0;

    // Small dataset (24). Single batch is fine but keep guard under 500 ops.
    let batch = writeBatch(db);
    let ops = 0;

    for (const d of snapshot.docs) {
        docsScanned++;
        const data = d.data() as any;
        const baseName: string = data.name_en || "";
        if (!baseName) continue;

        const slug = slugifyCategory(baseName);
        const map = categoryTranslations[slug];
        if (!map) continue; // Unknown category; skip

        const updateData: Record<string, any> = {};

        for (const code of langs) {
            const field = code === "en" ? "name_en" : `name_${code}`;
            // Do not override existing non-empty values
            const currentVal = data[field];
            if (typeof currentVal === "string" && currentVal.trim().length > 0) continue;

            // Compute label from map or fallback to known fields
            let label: string | undefined = map[code];
            if (!label) {
                if (code === "ar" && typeof data.name_ar === "string" && data.name_ar.trim()) label = data.name_ar;
                else if (code === "fil" && typeof data.name_fil === "string" && data.name_fil.trim()) label = data.name_fil;
                else if (map.en) label = map.en;
            }

            if (label) {
                updateData[field] = label;
                fieldsUpdated++;
            }
        }

        if (Object.keys(updateData).length > 0) {
            batch.update(doc(db, "service_categories", d.id), updateData);
            ops++;
            docsUpdated++;
        }

        // Safety flush for large datasets
        if (ops >= 450) {
            await batch.commit();
            batch = writeBatch(db);
            ops = 0;
        }
    }

    if (ops > 0) {
        await batch.commit();
    }

    return { docsScanned, docsUpdated, fieldsUpdated };
}
