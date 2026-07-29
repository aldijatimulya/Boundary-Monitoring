export default function Topbar({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <h1 className="text-lg font-medium text-slate-900">{title}</h1>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>Admin Medco</span>
        <div className="h-8 w-8 rounded-full bg-slate-200" />
      </div>
    </header>
  );
}
