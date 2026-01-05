import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
                <Sidebar />
            </div>
            <div className="flex flex-col">
                {/* Header could go here */}
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 mx-auto w-full max-w-7xl">
                    {children}
                </main>
            </div>
        </div>
    );
}
