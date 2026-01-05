"use client";

import { useState } from "react";
import { Loader2, Plus, X, Github } from "lucide-react";
import { RepoApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface Repository {
    id: number;
    owner: string;
    name: string;
    stars: number;
    language: string;
    updatedAt: string;
    scan_status: 'idle' | 'queued' | 'scanning' | 'completed' | 'failed';
}

interface AddRepoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (repo: Repository) => void;
}

export function AddRepoModal({ isOpen, onClose, onSuccess }: AddRepoModalProps) {
    const [loading, setLoading] = useState(false);
    const [owner, setOwner] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const repo = await RepoApi.create({ owner, name });
            onSuccess(repo);
            setOwner("");
            setName("");
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error.response?.data?.error || "Failed to add repository");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-primary-100 p-2">
                                        <Github className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">Add Repository</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Repository Owner
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={owner}
                                        onChange={(e) => setOwner(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="e.g., facebook"
                                        autoFocus
                                    />
                                    <p className="mt-1.5 text-xs text-gray-500">GitHub username or organization</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Repository Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="e.g., react"
                                    />
                                    <p className="mt-1.5 text-xs text-gray-500">The repository name</p>
                                </div>

                                {/* Preview */}
                                {owner && name && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="rounded-lg bg-gray-50 border border-gray-200 p-4"
                                    >
                                        <p className="text-xs font-medium text-gray-600 mb-1">Repository URL</p>
                                        <p className="text-sm font-mono text-gray-900">
                                            github.com/{owner}/{name}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Add Repository
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
