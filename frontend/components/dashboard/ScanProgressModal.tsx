"use client";

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Loader2,
    CheckCircle2,
    XCircle,
    FileText,
    Search,
    Sparkles,
    Clock
} from 'lucide-react';

interface ProgressEvent {
    timestamp: string;
    phase: string;
    message: string;
    filesProcessed?: number;
    totalFiles?: number;
    currentFile?: string;
}

interface ScanProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: {
        percentage: number;
        phase: string;
        events: ProgressEvent[];
    } | null;
    status: 'pending' | 'active' | 'completed' | 'failed';
    signalsFound: number;
    onCancel?: () => void;
}

export default function ScanProgressModal({
    isOpen,
    onClose,
    progress,
    status,
    signalsFound,
    onCancel
}: ScanProgressModalProps) {
    const [autoScroll, setAutoScroll] = useState(true);

    // Auto-scroll to bottom when new events arrive
    useEffect(() => {
        if (autoScroll && progress?.events) {
            const logContainer = document.getElementById('progress-log');
            if (logContainer) {
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        }
    }, [progress?.events, autoScroll]);

    const getPhaseIcon = (phase: string) => {
        switch (phase) {
            case 'fetching_tree':
            case 'analyzing_structure':
                return <Search className="h-4 w-4" />;
            case 'scanning_files':
                return <FileText className="h-4 w-4" />;
            case 'processing_signals':
                return <Sparkles className="h-4 w-4" />;
            case 'completed':
                return <CheckCircle2 className="h-4 w-4" />;
            case 'failed':
            case 'cancelled':
                return <XCircle className="h-4 w-4" />;
            default:
                return <Loader2 className="h-4 w-4 animate-spin" />;
        }
    };

    const getPhaseColor = (phase: string) => {
        switch (phase) {
            case 'completed':
                return 'text-green-600 bg-green-100';
            case 'failed':
            case 'cancelled':
                return 'text-red-600 bg-red-100';
            case 'processing_signals':
                return 'text-purple-600 bg-purple-100';
            default:
                return 'text-primary-600 bg-primary-100';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour12: false });
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                                {/* Header */}
                                <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${getPhaseColor(progress?.phase || 'pending')}`}>
                                                {getPhaseIcon(progress?.phase || 'pending')}
                                                <span className="text-sm font-semibold capitalize">
                                                    {progress?.phase?.replace('_', ' ') || 'Pending'}
                                                </span>
                                            </div>
                                            <Dialog.Title className="text-lg font-semibold text-gray-900">
                                                Scan Progress
                                            </Dialog.Title>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white hover:text-gray-600"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-gray-700">
                                                {progress?.percentage || 0}% Complete
                                            </span>
                                            <span className="text-gray-500">
                                                {signalsFound} signal{signalsFound !== 1 ? 's' : ''} found
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/60">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress?.percentage || 0}%` }}
                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                                className="h-full rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Log */}
                                <div className="p-6">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-700">Activity Log</h3>
                                        <label className="flex items-center gap-2 text-xs text-gray-500">
                                            <input
                                                type="checkbox"
                                                checked={autoScroll}
                                                onChange={(e) => setAutoScroll(e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                            Auto-scroll
                                        </label>
                                    </div>
                                    <div
                                        id="progress-log"
                                        className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4"
                                    >
                                        <AnimatePresence>
                                            {progress?.events && progress.events.length > 0 ? (
                                                progress.events.map((event, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.05 }}
                                                        className="flex items-start gap-3 rounded-lg bg-white p-3 text-sm shadow-sm"
                                                    >
                                                        <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs text-gray-500">
                                                                    {formatTime(event.timestamp)}
                                                                </span>
                                                                <span className="text-xs font-semibold uppercase text-primary-600">
                                                                    {event.phase}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-gray-700">{event.message}</p>
                                                            {event.filesProcessed !== undefined && event.totalFiles && (
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Progress: {event.filesProcessed}/{event.totalFiles} files
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center text-sm text-gray-500">
                                                    No activity yet...
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            {status === 'active' && (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                                                    Scan in progress...
                                                </span>
                                            )}
                                            {status === 'completed' && (
                                                <span className="flex items-center gap-2 text-green-600">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Scan completed successfully
                                                </span>
                                            )}
                                            {status === 'failed' && (
                                                <span className="flex items-center gap-2 text-red-600">
                                                    <XCircle className="h-4 w-4" />
                                                    Scan failed
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {status === 'active' && onCancel && (
                                                <button
                                                    onClick={onCancel}
                                                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                                >
                                                    Cancel Scan
                                                </button>
                                            )}
                                            <button
                                                onClick={onClose}
                                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                                            >
                                                {status === 'active' ? 'Minimize' : 'Close'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
