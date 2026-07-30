"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    label: "Monitoring",
    items: [
      { href: "/dashboard", text: "Dashboard" },
      { href: "/timeline", text: "Timeline" },
      { href: "/report", text: "Reconstruction Report" },
      { href: "/patok", text: "Patok Report" },
      { href: "/spatial", text: "Spatial Map" },
      { href: "/analytics", text: "Analytics" },
    ],
  },
  {
    label: "Report",
    items: [
      { href: "/reports/daily", text: "Daily Report" },
      { href: "/reports/weekly", text: "Weekly Report" },
      { href: "/reports/monthly", text: "Monthly Report" },
    ],
  },
  {
    label: "Document",
    items: [{ href: "/documents", text: "Document Center" }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 bg-navy-950 text-slate-300 md:flex md:flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-sm font-medium text-white">
          M
        </div>
        <div>
          <p className="text-sm font-medium text-white">Boundary Monitor</p>
          <p className="text-xs text-slate-400">Medco E&P SSR</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-2 text-sm transition ${
                      active
                        ? "bg-brand-blue/15 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.text}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
