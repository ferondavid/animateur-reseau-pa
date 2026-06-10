"use client";

import type { LucideIcon } from "lucide-react";

export type ActionGradient = "teal" | "blue" | "peach" | "purple" | "slate";

interface ActionRapideProps {
  icon: LucideIcon;
  label: string;
  gradient: ActionGradient;
  onClick?: () => void;
  href?: string;
}

export default function ActionRapide({
  icon: Icon,
  label,
  gradient,
  onClick,
  href,
}: ActionRapideProps) {
  const cls = `pa-action-btn pa-action-${gradient}`;
  const inner = (
    <>
      <span className="pa-action-icon">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span style={{ fontSize: "11px", fontWeight: 600, lineHeight: 1.2 }}>
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
