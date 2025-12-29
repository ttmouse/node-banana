"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWorkflowStore } from "@/store/workflowStore";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { generationsPath, setGenerationsPath } = useWorkflowStore();
    const [localPath, setLocalPath] = useState(generationsPath || "");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setLocalPath(generationsPath || "");
        return () => setMounted(false);
    }, [generationsPath]);

    const handleSave = () => {
        // Basic validation could be added here
        setGenerationsPath(localPath || null);
        onClose();
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-semibold text-neutral-100 mb-4">Settings</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Local Image Storage Path
                        </label>
                        <p className="text-xs text-neutral-500 mb-2">
                            Images will be saved to this directory. If empty, images are stored in browser memory only.
                        </p>
                        <input
                            type="text"
                            value={localPath}
                            onChange={(e) => setLocalPath(e.target.value)}
                            placeholder="/Users/username/Pictures/node-banana"
                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 text-sm focus:outline-none focus:border-neutral-500"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
