// Avatar inisial dengan warna berbeda per user -- dihitung deterministik dari
// nama (hash sederhana), jadi orang yang sama selalu dapat warna yang sama
// tiap login, dan antar user kelihatan beda secara visual tanpa perlu upload
// foto profil sungguhan.

const PALETTE = [
  { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" },
  { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-200" },
  { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-200" },
  { bg: "bg-cyan-100", text: "text-cyan-700", ring: "ring-cyan-200" },
  { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-200" },
  { bg: "bg-teal-100", text: "text-teal-700", ring: "ring-teal-200" },
] as const;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarStyle(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  surveyor: "Surveyor",
  pic_lapangan: "PIC Lapangan",
  viewer_medco: "Viewer Medco",
};
