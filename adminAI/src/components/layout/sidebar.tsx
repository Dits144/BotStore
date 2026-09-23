"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  ShoppingBag,
  Package,
  BookOpen,
  Bot,
  QrCode,
  BarChart3,
  FileText,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inbox", href: "/inbox", icon: Inbox, badge: "3" },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Products", href: "/products", icon: Package },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "AI Settings", href: "/ai-settings", icon: Bot },
  { name: "WhatsApp", href: "/whatsapp", icon: QrCode },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Logs", href: "/logs", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-base leading-tight tracking-wide">
            DitsStore AI
          </h1>
          <p className="text-xs text-slate-400 font-medium">WhatsApp Customer Service</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-semibold",
                    isActive ? "bg-white/20 text-white" : "bg-indigo-500/20 text-indigo-400"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            DS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">DitsStore Admin</p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
