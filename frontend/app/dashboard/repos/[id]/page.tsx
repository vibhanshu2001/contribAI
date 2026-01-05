"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Play, AlertCircle, FileText, CheckCircle, Star, GitBranch, Calendar, RotateCw, Trash2, Code, ArrowLeft, ExternalLink, Activity } from "lucide-react";
import { RepoApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import ScanProgressModal from "@/components/dashboard/ScanProgressModal";
import { useCallback } from "react";

interface Repository {
    id: number;
    owner: string;
    name: string;
    stars: number;
    language: string;
    updatedAt: string;
    scan_status: 'idle' | 'queued' | 'scanning' | 'completed' | 'failed';
    last_scan_at: string | null;
    scan_cursor: string | null;
    ScanJobs?: Array<{
        id: number;
        status: string;
        started_at: string;
        signals_found: number;
    }>;
}

interface Signal {
    id: number;
    file_path: string;
    line_number: number;
    type: string;
    snippet: string;
}

interface ScanProgress {
    percentage: number;
    phase: string;
    events: Array<{
        timestamp: string;
        phase: string;
        message: string;
        filesProcessed?: number;
        totalFiles?: number;
        currentFile?: string;
    }>;
}

export default function RepoDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = parseInt(params.id as string);
    const [repo, setRepo] = useState<Repository | null>(null);
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [resuming, setResuming] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'history'>('overview');
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
    const [scanStatus, setScanStatus] = useState<'pending' | 'active' | 'completed' | 'failed'>('pending');
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const stopPolling = useCallback(() => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    }, []);

    const loadRepo = useCallback(async () => {
        try {
            const data = await RepoApi.get(id);
            setRepo(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load repository");
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadSignals = useCallback(async () => {
        try {
            const data = await RepoApi.getSignals(id);
            setSignals(data);
        } catch (error) {
            console.error(error);
        }
    }, [id]);

    const loadProgress = useCallback(async () => {
        try {
            const data = await RepoApi.getScanProgress(id);
            setScanProgress(data.progress);
            setScanStatus(data.status);
        } catch (error) {
            console.error(error);
        }
    }, [id]);

    const startPolling = useCallback(() => {
        if (pollInterval.current) return;
        pollInterval.current = setInterval(() => {
            loadRepo();
            loadSignals();
            loadProgress();
        }, 2000);
    }, [loadRepo, loadSignals, loadProgress]);


    useEffect(() => {
        loadRepo();
        loadSignals();
        return () => stopPolling();
    }, [id, loadRepo, loadSignals, stopPolling]);

    useEffect(() => {
        if (repo?.scan_status === 'scanning' || repo?.scan_status === 'queued') {
            startPolling();
            setShowProgressModal(true);
        } else {
            stopPolling();
        }
    }, [repo?.scan_status, startPolling, stopPolling]);


    const handleScan = async () => {
        setScanning(true);
        setRepo((prev) => prev ? ({ ...prev, scan_status: 'scanning' }) : null);
        setShowProgressModal(true);
        try {
            await RepoApi.scan(id);
            toast.success("Scan started successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to start scan");
            setRepo((prev) => prev ? ({ ...prev, scan_status: 'failed' }) : null);
        } finally {
            setScanning(false);
        }
    };

    const handleResumeScan = async () => {
        setResuming(true);
        setShowProgressModal(true);
        try {
            await RepoApi.resumeScan(id);
            toast.success("Scan resumed!");
            await loadRepo();
        } catch (error) {
            console.error(error);
            toast.error("Failed to resume scan");
        } finally {
            setResuming(false);
        }
    };

    const handleCancelScan = async () => {
        try {
            await RepoApi.cancelScan(id);
            toast.success("Scan cancelled");
            await loadRepo();
            setShowProgressModal(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to cancel scan");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this repository? This cannot be undone.")) return;
        setDeleting(true);
        try {
            await RepoApi.delete(id);
            toast.success("Repository deleted");
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete repository");
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!repo) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">Repository not found</p>
            </div>
        );
    }

    const isScanning = repo.scan_status === 'scanning' || repo.scan_status === 'queued';
    const canResume = repo.scan_cursor && repo.scan_status === 'failed';

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Link>

            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 p-8 shadow-xl"
            >
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-3xl font-bold text-white">
                                    {repo.owner}/{repo.name}
                                </h1>
                                <a
                                    href={`https://github.com/${repo.owner}/${repo.name}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-white/90">
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                                    <span className="font-medium">{repo.stars?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GitBranch className="h-4 w-4" />
                                    <span>{repo.language || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={`/dashboard/repos/${id}/issues`}
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary-600 shadow-lg transition hover:bg-gray-50"
                            >
                                <FileText className="h-4 w-4" />
                                Review Issues
                            </Link>
                            {isScanning ? (
                                <button
                                    onClick={() => setShowProgressModal(true)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-600"
                                >
                                    <Activity className="h-4 w-4" />
                                    View Progress
                                </button>
                            ) : canResume ? (
                                <button
                                    onClick={handleResumeScan}
                                    disabled={resuming}
                                    className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-600"
                                >
                                    {resuming ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                                    Resume Scan
                                </button>
                            ) : (
                                <button
                                    onClick={handleScan}
                                    disabled={scanning}
                                    className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-gray-50"
                                >
                                    <Play className="h-4 w-4" />
                                    Force Scan
                                </button>
                            )}
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-lg bg-red-500/20 p-2.5 text-white transition hover:bg-red-500/30"
                                title="Delete Repository"
                            >
                                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
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
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full",
                            repo.scan_status === 'completed' ? "bg-emerald-100 text-emerald-600" :
                                repo.scan_status === 'failed' ? "bg-red-100 text-red-600" :
                                    isScanning ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                        )}>
                            {isScanning ? <RotateCw className="h-6 w-6 animate-spin" /> :
                                repo.scan_status === 'completed' ? <CheckCircle className="h-6 w-6" /> :
                                    <AlertCircle className="h-6 w-6" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Status</p>
                            <p className="text-xl font-bold capitalize text-gray-900">{repo.scan_status}</p>
                        </div>
                    </div>
                    {isScanning && (
                        <div className="mt-3 text-xs text-blue-600 font-medium">
                            Analyzing codebase...
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                            <Code className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Signals Found</p>
                            <p className="text-xl font-bold text-gray-900">{signals.length}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Last Scan</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {repo.last_scan_at ? new Date(repo.last_scan_at).toLocaleDateString() : 'Never'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-8">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'signals', label: `Signals (${signals.length})` },
                        { id: 'history', label: 'Scan History' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'overview' | 'signals' | 'history')}
                            className={cn(
                                "border-b-2 pb-3 text-sm font-medium transition",
                                activeTab === tab.id
                                    ? "border-primary-600 text-primary-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'signals' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {signals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                                <Code className="h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-lg font-medium text-gray-900 mb-2">No signals found</p>
                                <p className="text-gray-500">Run a scan to detect potential issues</p>
                            </div>
                        ) : (
                            signals.map((sig, index) => (
                                <motion.div
                                    key={sig.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="rounded-lg border border-gray-200 bg-white p-5 hover:shadow-md transition"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="font-mono text-sm text-gray-700 break-all">
                                            {sig.file_path}:<span className="text-primary-600 font-semibold">{sig.line_number}</span>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium uppercase text-purple-700">
                                            {sig.type}
                                        </span>
                                    </div>
                                    <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100 border border-gray-700">
                                        {sig.snippet}
                                    </pre>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}

                {activeTab === 'history' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3"
                    >
                        {repo.ScanJobs?.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()).map((job, index) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-5 hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-3 w-3 rounded-full",
                                        job.status === 'completed' ? "bg-emerald-500" :
                                            job.status === 'failed' ? "bg-red-500" : "bg-blue-500 animate-pulse"
                                    )} />
                                    <div>
                                        <div className="font-medium text-gray-900 capitalize">{job.status}</div>
                                        <div className="text-sm text-gray-500">{new Date(job.started_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-gray-900">{job.signals_found}</div>
                                    <div className="text-xs text-gray-500">Signals</div>
                                </div>
                            </motion.div>
                        ))}
                        {(!repo.ScanJobs || repo.ScanJobs.length === 0) && (
                            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                                <RotateCw className="h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-lg font-medium text-gray-900 mb-2">No scans yet</p>
                                <button onClick={handleScan} className="mt-2 text-sm text-primary-600 hover:underline">
                                    Start your first scan
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border border-gray-200 bg-white p-8"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Repository Information</h3>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                                <dd className="mt-1 text-sm text-gray-900">{repo.owner}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{repo.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Language</dt>
                                <dd className="mt-1 text-sm text-gray-900">{repo.language || 'Unknown'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Stars</dt>
                                <dd className="mt-1 text-sm text-gray-900">{repo.stars?.toLocaleString() || 0}</dd>
                            </div>
                        </dl>
                    </motion.div>
                )}
            </div>

            {/* Progress Modal */}
            <ScanProgressModal
                isOpen={showProgressModal}
                onClose={() => setShowProgressModal(false)}
                progress={scanProgress}
                status={scanStatus}
                signalsFound={repo.ScanJobs?.[0]?.signals_found || 0}
                onCancel={handleCancelScan}
            />
        </div>
    );
}
