"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Loader2, Sparkles, GitBranch, CheckCircle, Clock } from "lucide-react";
import { RepoApi, setAuthToken } from "@/lib/api";
import { AddRepoModal } from "@/components/dashboard/AddRepoModal";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface Repository {
    id: number;
    owner: string;
    name: string;
    stars: number;
    language: string;
    updatedAt: string;
    scan_status: 'idle' | 'queued' | 'scanning' | 'completed' | 'failed';
}

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadRepos = useCallback(async () => {
        try {
            const data = await RepoApi.list();
            setRepos(data);
        } catch (error) {
            console.error("Failed to fetch repos", error);
            toast.error("Failed to load repositories");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            setAuthToken(token);
            router.replace("/dashboard");
            toast.success("Successfully logged in!");
        }
        loadRepos();
    }, [searchParams, router, loadRepos]);

    const stats = {
        total: repos.length,
        completed: repos.filter(r => r.scan_status === 'completed').length,
        scanning: repos.filter(r => r.scan_status === 'scanning').length,
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <>
            <AddRepoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={(newRepo) => {
                    setRepos([newRepo, ...repos]);
                    toast.success("Repository added successfully!");
                }}
            />

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 p-8 md:p-12 shadow-2xl"
            >
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="h-8 w-8 text-white" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            Contribution Assistant
                        </h1>
                    </div>
                    <p className="text-white/90 text-lg mb-6 max-w-2xl">
                        Discover high-quality contribution opportunities with AI-powered issue detection and drafting.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-lg transition hover:bg-gray-50 hover:scale-105"
                    >
                        <Plus className="h-5 w-5" />
                        Add Repository
                    </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-primary-100 p-3">
                            <GitBranch className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Repositories</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-emerald-100 p-3">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Scans Completed</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-blue-100 p-3">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Scans</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.scanning}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Repository Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Your Repositories</h2>

                {repos.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16 text-center"
                    >
                        <GitBranch className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">No repositories yet</p>
                        <p className="text-gray-500 mb-6">Add your first repository to get started</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700"
                        >
                            <Plus className="h-4 w-4" />
                            Add Repository
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {repos.map((repo, index) => (
                            <motion.div
                                key={repo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    href={`/dashboard/repos/${repo.id}`}
                                    className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary-300"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                                {repo.owner}/{repo.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">{repo.language || "Unknown"}</p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ml-2
                                            ${repo.scan_status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                repo.scan_status === 'failed' ? 'bg-red-100 text-red-700' :
                                                    repo.scan_status === 'scanning' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {repo.scan_status}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            ⭐ {repo.stars?.toLocaleString() || 0}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(repo.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
