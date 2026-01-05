"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Github, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
    { href: "/dashboard", label: "Repositories", icon: LayoutDashboard }
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col border-r bg-gray-50/50 dark:bg-zinc-900/50">
            <div className="flex h-14 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <Github className="h-6 w-6" />
                    <span>ContribAI</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href; // Exact match for simplicity in MVP
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-gray-900 dark:hover:text-gray-50",
                                    isActive ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-500">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Logged in as Admin</span>
                </div>
            </div>
        </div>
    );
}
