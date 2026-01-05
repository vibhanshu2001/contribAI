"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { IssueApi } from "@/lib/api";
import MarkdownPreview from "@/components/dashboard/MarkdownPreview";
import {
    ArrowLeft,
    Save,
    Send,
    ExternalLink,
    FileCode,
    Eye,
    Columns,
    AlertCircle,
    TrendingUp,
    GitBranch,
    Clock,
    CheckCircle2,
    Sparkles
} from "lucide-react";

type ViewMode = 'edit' | 'preview' | 'split';

interface Issue {
    id: number;
    title: string;
    body: string;
    status: 'draft' | 'published';
    category: string;
    confidence_score: number;
    github_issue_url?: string;
    Signal?: {
        file_path: string;
        line_number: number;
        type: string;
        snippet: string;
    };
}

export default function IssueDetailPage() {
    const params = useParams();
    const router = useRouter();
    const repoId = parseInt(params.id as string);
    const issueId = parseInt(params.issueId as string);

    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('split');

    // Edit State
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const loadIssue = useCallback(async () => {
        try {
            const data = await IssueApi.get(issueId);
            setIssue(data);
            setTitle(data.title);
            setBody(data.body);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load issue");
        } finally {
            setLoading(false);
        }
    }, [issueId]);

    useEffect(() => {
        loadIssue();
    }, [issueId, loadIssue]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await IssueApi.update(issueId, { title, body });
            await loadIssue();
            toast.success("Draft saved successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save draft");
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!confirm("Are you sure you want to publish this issue to GitHub?")) return;
        setSaving(true);
        try {
            await IssueApi.publish(issueId);
            toast.success("Issue published to GitHub!");
            router.push(`/dashboard/repos/${repoId}/issues`);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }; message: string };
            const message = err.response?.data?.error || err.message;
            toast.error(`Failed to publish: ${message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading issue...</p>
                </div>
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Issue not found</h3>
            </div>
        );
    }

    const hasChanges = title !== issue.title || body !== issue.body;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/dashboard/repos/${repoId}/issues`)}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Issue Preview</h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Review and edit before publishing to GitHub
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {issue.status === 'published' ? (
                        <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Published
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            <Clock className="h-3.5 w-3.5" />
                            Draft
                        </div>
                    )}

                    {/* Action Buttons */}
                    {issue.status === 'draft' && (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving || !hasChanges}
                                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="h-4 w-4" />
                                {hasChanges ? 'Save Changes' : 'Saved'}
                            </button>
                            <button
                                onClick={handlePublish}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-green-500/30 transition hover:shadow-xl hover:shadow-green-500/40 disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                                Publish to GitHub
                            </button>
                        </>
                    )}
                    {issue.status === 'published' && (
                        <a
                            href={issue.github_issue_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View on GitHub
                        </a>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* Left: Editor/Preview */}
                <div className="space-y-4">
                    {/* View Mode Tabs */}
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
                        <button
                            onClick={() => setViewMode('edit')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${viewMode === 'edit'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <FileCode className="h-4 w-4" />
                            Edit
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${viewMode === 'preview'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Eye className="h-4 w-4" />
                            Preview
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${viewMode === 'split'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Columns className="h-4 w-4" />
                            Split
                        </button>
                    </div>

                    {/* Title Input */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700">Issue Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter issue title..."
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-semibold text-gray-900 placeholder-gray-400 transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>

                    {/* Content Editor/Preview */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <AnimatePresence mode="wait">
                            {viewMode === 'edit' && (
                                <motion.div
                                    key="edit"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-6"
                                >
                                    <label className="block text-sm font-semibold text-gray-700">Description (Markdown)</label>
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        rows={20}
                                        placeholder="Write your issue description in Markdown..."
                                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </motion.div>
                            )}

                            {viewMode === 'preview' && (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-6"
                                >
                                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <Eye className="h-4 w-4" />
                                        Preview
                                    </div>
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                                        <MarkdownPreview content={body} />
                                    </div>
                                </motion.div>
                            )}

                            {viewMode === 'split' && (
                                <motion.div
                                    key="split"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-2 divide-x divide-gray-200"
                                >
                                    <div className="p-6">
                                        <label className="block text-sm font-semibold text-gray-700">Markdown</label>
                                        <textarea
                                            value={body}
                                            onChange={(e) => setBody(e.target.value)}
                                            rows={20}
                                            placeholder="Write in Markdown..."
                                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm text-gray-900 placeholder-gray-400 transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Eye className="h-4 w-4" />
                                            Preview
                                        </div>
                                        <div className="max-h-[560px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <MarkdownPreview content={body} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right: Metadata Sidebar */}
                <div className="space-y-4">
                    {/* AI Confidence */}
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Sparkles className="h-4 w-4 text-primary-500" />
                            AI Confidence
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-gray-900">
                                    {(issue.confidence_score * 100).toFixed(0)}%
                                </span>
                                <TrendingUp className={`h-5 w-5 ${issue.confidence_score > 0.7 ? 'text-green-500' : 'text-amber-500'}`} />
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${issue.confidence_score * 100}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={`h-full rounded-full ${issue.confidence_score > 0.7
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        }`}
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                {issue.confidence_score > 0.7 ? 'High confidence' : 'Moderate confidence'} - Review carefully before publishing
                            </p>
                        </div>
                    </div>

                    {/* Category */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <GitBranch className="h-4 w-4 text-gray-500" />
                            Category
                        </div>
                        <div className="mt-3">
                            <span className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide ${issue.category === 'bug' ? 'bg-red-100 text-red-700' :
                                issue.category === 'enhancement' ? 'bg-blue-100 text-blue-700' :
                                    'bg-purple-100 text-purple-700'
                                }`}>
                                {issue.category}
                            </span>
                        </div>
                    </div>

                    {/* Source Signal */}
                    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            Source Signal
                        </div>
                        <div className="mt-4 space-y-3">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">File Location</div>
                                <div className="mt-1 break-all rounded-lg bg-white/60 px-3 py-2 font-mono text-xs text-gray-900">
                                    {issue.Signal?.file_path}:{issue.Signal?.line_number}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Signal Type</div>
                                <div className="mt-1 text-sm font-medium text-gray-900">{issue.Signal?.type}</div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Code Snippet</div>
                                <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                                    {issue.Signal?.snippet}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
