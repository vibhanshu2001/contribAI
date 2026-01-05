"use client";

import { Github } from "lucide-react";

export default function LoginPage() {
    const backendUrl = "http://localhost:3001/api/auth/login";

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-xl">
                <div className="text-center">
                    <Github className="mx-auto h-12 w-12 text-gray-900" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Sign in to ContribAI
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Connect your GitHub account to start managing issues.
                    </p>
                </div>
                <div className="mt-8 space-y-6">
                    <a
                        href={backendUrl}
                        className="group relative flex w-full justify-center rounded-md border border-transparent bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Github className="h-5 w-5 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
                        </span>
                        Sign in with GitHub
                    </a>
                </div>
            </div>
        </div>
    );
}
