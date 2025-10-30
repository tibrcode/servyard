import React from "react";
import CategoryCard from "@/components/CategoryCard";

type Item = {
  icon: React.ReactNode;
  title: string;
};

export default function CategoriesGrid({ items }: { items: Item[] }) {
  return (
    <div
      className="
        grid grid-cols-3 gap-4 px-4
        md:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]
        lg:[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]
      "
    >
      {items.map((c) => (
        <CategoryCard key={c.title} icon={c.icon} title={c.title} />
      ))}
    </div>
  );
}
