"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useWorkflowStore } from "@/store/workflowStore";
import { useSettingsStore } from "@/store/settingsStore";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ValidationStatus = "idle" | "loading" | "success" | "error";

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { generationsPath, setGenerationsPath } = useWorkflowStore();
    const apiConfig = useSettingsStore((state) => state.apiConfig);
    const setApiConfig = useSettingsStore((state) => state.setApiConfig);

    const [localPath, setLocalPath] = useState(generationsPath || "");
    const [apiKey, setApiKey] = useState(apiConfig.apiKey);
    const [apiEndpoint, setApiEndpoint] = useState(apiConfig.apiEndpoint);
    const [showApiKey, setShowApiKey] = useState(false);
    const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");
    const [validationMessage, setValidationMessage] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setLocalPath(generationsPath || "");
        setApiKey(apiConfig.apiKey);
        setApiEndpoint(apiConfig.apiEndpoint);
        return () => setMounted(false);
    }, [generationsPath, apiConfig]);

    const handleSave = useCallback(() => {
        setGenerationsPath(localPath || null);
        setApiConfig({ apiKey, apiEndpoint });
        onClose();
    }, [localPath, apiKey, apiEndpoint, setGenerationsPath, setApiConfig, onClose]);

    const handleCancel = useCallback(() => {
        setLocalPath(generationsPath || "");
        setApiKey(apiConfig.apiKey);
        setApiEndpoint(apiConfig.apiEndpoint);
        setValidationStatus("idle");
        setValidationMessage("");
        onClose();
    }, [generationsPath, apiConfig, onClose]);

    const handleValidate = useCallback(async () => {
        if (!apiKey) {
            setValidationStatus("error");
            setValidationMessage("请输入 API Key");
            return;
        }

        setValidationStatus("loading");
        setValidationMessage("");

        try {
            // Use the validate endpoint which accepts both text and image responses
            const response = await fetch("/api/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    apiKey,
                    apiEndpoint: apiEndpoint || undefined,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setValidationStatus("success");
                setValidationMessage(result.message || "连接成功！");
            } else {
                setValidationStatus("error");
                setValidationMessage(result.error || "验证失败");
            }
        } catch (error) {
            setValidationStatus("error");
            setValidationMessage(error instanceof Error ? error.message : "连接失败");
        }
    }, [apiKey, apiEndpoint]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
        >
            <div
                className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-semibold text-neutral-100 mb-4">Settings</h2>

                <div className="space-y-6">
                    {/* API Configuration Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">API Configuration</h3>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                                API Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        setValidationStatus("idle");
                                    }}
                                    placeholder="Enter your API key"
                                    className="w-full px-3 py-2 pr-10 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 text-sm focus:outline-none focus:border-neutral-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                                >
                                    {showApiKey ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                                Your Gemini API key for image generation
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                                API Endpoint
                            </label>
                            <input
                                type="text"
                                value={apiEndpoint}
                                onChange={(e) => {
                                    setApiEndpoint(e.target.value);
                                    setValidationStatus("idle");
                                }}
                                placeholder="e.g., http://127.0.0.1:8045"
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 text-sm focus:outline-none focus:border-neutral-500"
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                Custom API endpoint (leave empty for default Google API)
                            </p>
                        </div>

                        {/* Validation Button and Status */}
                        <div className="space-y-2">
                            <button
                                onClick={handleValidate}
                                disabled={validationStatus === "loading" || !apiKey}
                                className={`w-full px-4 py-2 text-sm rounded transition-colors flex items-center justify-center gap-2 ${
                                    validationStatus === "loading"
                                        ? "bg-neutral-700 text-neutral-400 cursor-wait"
                                        : !apiKey
                                        ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-500 text-white"
                                }`}
                            >
                                {validationStatus === "loading" ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Validate Connection
                                    </>
                                )}
                            </button>

                            {validationMessage && (
                                <div
                                    className={`text-sm px-3 py-2 rounded ${
                                        validationStatus === "success"
                                            ? "bg-green-900/30 text-green-400 border border-green-800"
                                            : "bg-red-900/30 text-red-400 border border-red-800"
                                    }`}
                                >
                                    {validationStatus === "success" ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {validationMessage}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {validationMessage}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-neutral-700" />

                    {/* Storage Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Storage</h3>

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
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={handleCancel}
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
