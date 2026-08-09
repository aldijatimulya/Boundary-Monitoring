import { Folder, Map, Box, FileText, FileSpreadsheet, Camera, Plane, MoreHorizontal, LucideIcon } from "lucide-react";
import { DocumentCategory } from "@/lib/types";

export const CATEGORY_ICON: Record<DocumentCategory | "semua", LucideIcon> = {
  semua: Folder,
  shp: Map,
  dxf: Box,
  pdf: FileText,
  excel: FileSpreadsheet,
  foto: Camera,
  drone: Plane,
  lainnya: MoreHorizontal,
};

export const CATEGORY_ACCENT: Record<DocumentCategory | "semua", string> = {
  semua: "text-brand-blue",
  shp: "text-teal-600",
  dxf: "text-indigo-600",
  pdf: "text-red-600",
  excel: "text-emerald-600",
  foto: "text-amber-600",
  drone: "text-sky-600",
  lainnya: "text-slate-500",
};

export const CATEGORY_BADGE: Record<DocumentCategory, string> = {
  shp: "bg-teal-100 text-teal-700",
  dxf: "bg-indigo-100 text-indigo-700",
  pdf: "bg-red-100 text-red-700",
  excel: "bg-emerald-100 text-emerald-700",
  foto: "bg-amber-100 text-amber-700",
  drone: "bg-sky-100 text-sky-700",
  lainnya: "bg-slate-100 text-slate-600",
};
