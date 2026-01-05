"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { IssueApi } from "@/lib/api";
import { FileText, ArrowLeft, CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";

interface Issue {
    id: number;
    title: string;
    body: string;
    status: 'draft' | 'published';
    category: string;
    confidence_score: number;
    Signal?: {
        file_path: string;
    };
}

export default function IssuesListPage() {
    const params = useParams();
    const repoId = parseInt(params.id as string);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);

    const loadIssues = useCallback(async () => {
        try {
            const data = await IssueApi.list(repoId);
            setIssues(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [repoId]);

    useEffect(() => {
        loadIssues();
    }, [repoId, loadIssues]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading issues...</p>
                </div>
            </div>
        );
    }

    const draftCount = issues.filter(i => i.status === 'draft').length;
    const publishedCount = issues.filter(i => i.status === 'published').length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Review Issues</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {draftCount} draft{draftCount !== 1 ? 's' : ''} · {publishedCount} published
                    </p>
                </div>
                <Link
                    href={`/dashboard/repos/${repoId}`}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Repo
                </Link>
            </div>

            {/* Issues List */}
            <div className="space-y-4">
                {issues.map((issue, index) => (
                    <motion.div
                        key={issue.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link
                            href={`/dashboard/repos/${repoId}/issues/${issue.id}`}
                            className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-primary-300 hover:shadow-lg"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left: Content */}
                                    <div className="flex-1 space-y-3">
                                        {/* Title & Category */}
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <FileText className="h-5 w-5 text-gray-400 transition group-hover:text-primary-500" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide
                                                        ${issue.category === 'bug' ? 'bg-red-100 text-red-700' :
                                                            issue.category === 'enhancement' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-purple-100 text-purple-700'}
                                                    `}>
                                                        {issue.category}
                                                    </span>
                                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition">
                                                        {issue.title}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                    {issue.body}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500 ml-8">
                                            {issue.Signal && (
                                                <div className="flex items-center gap-1">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    <span className="font-mono">{issue.Signal.file_path}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Status & Confidence */}
                                    <div className="flex flex-col items-end gap-3">
                                        {/* Status Badge */}
                                        <div className="flex items-center gap-2">
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
                                        </div>

                                        {/* Confidence Score */}
                                        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                            <TrendingUp className={`h-4 w-4 ${issue.confidence_score > 0.7 ? 'text-green-500' : 'text-amber-500'}`} />
                                            <div className="text-right">
                                                <div className="text-xs font-medium text-gray-500">Confidence</div>
                                                <div className={`text-sm font-bold ${issue.confidence_score > 0.7 ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {(issue.confidence_score * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom gradient indicator */}
                            <div className="h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
                        </Link>
                    </motion.div>
                ))}

                {/* Empty State */}
                {issues.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16 text-center"
                    >
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No issues drafted yet</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Trigger a scan to discover potential issues in your repository
                        </p>
                        <Link
                            href={`/dashboard/repos/${repoId}`}
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
                        >
                            Go to Repository
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
