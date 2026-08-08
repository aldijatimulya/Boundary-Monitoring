import Sidebar from "@/components/Sidebar";
import { MobileNavProvider } from "@/lib/mobile-nav-context";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileNavProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </MobileNavProvider>
  );
}
