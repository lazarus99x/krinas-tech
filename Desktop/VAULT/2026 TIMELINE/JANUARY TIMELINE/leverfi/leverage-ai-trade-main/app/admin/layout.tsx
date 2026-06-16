"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopNav } from "@/components/admin/admin-top-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${open ? "block" : "hidden"} md:block md:w-64 flex-shrink-0`}
      >
        <AdminSidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden p-2 border-b border-border bg-card">
          <button
            className="px-3 py-2 text-sm rounded border"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close Menu" : "Open Menu"}
          </button>
        </div>
        <AdminTopNav />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
