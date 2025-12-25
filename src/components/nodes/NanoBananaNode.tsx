"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store/workflowStore";
import { NanoBananaNodeData, AspectRatio, AspectRatioOption, Resolution, ModelType } from "@/types";

// All 10 aspect ratios supported by both models (excluding the dynamic "original" option)
const FIXED_ASPECT_RATIOS: AspectRatio[] = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
const ASPECT_RATIO_OPTIONS: { value: AspectRatioOption; label: string }[] = [
  { value: "original", label: "Original (match input)" },
  ...FIXED_ASPECT_RATIOS.map((ratio) => ({ value: ratio, label: ratio })),
];

// Resolutions only for Nano Banana Pro (gemini-3-pro-image-preview)
const RESOLUTIONS: Resolution[] = ["1K", "2K", "4K"];

const MODELS: { value: ModelType; label: string }[] = [
  { value: "nano-banana", label: "Nano Banana" },
  { value: "nano-banana-pro", label: "Nano Banana Pro" },
];

type NanoBananaNodeType = Node<NanoBananaNodeData, "nanoBanana">;

export function NanoBananaNode({ id, data, selected }: NodeProps<NanoBananaNodeType>) {
  const nodeData = data;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleAspectRatioChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { aspectRatio: e.target.value as AspectRatioOption });
    },
    [id, updateNodeData]
  );

  const handleResolutionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { resolution: e.target.value as Resolution });
    },
    [id, updateNodeData]
  );

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { model: e.target.value as ModelType });
    },
    [id, updateNodeData]
  );

  const handleGoogleSearchToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { useGoogleSearch: e.target.checked });
    },
    [id, updateNodeData]
  );

  const handleClearImage = useCallback(() => {
    updateNodeData(id, { outputImage: null, status: "idle", error: null });
  }, [id, updateNodeData]);

  const regenerateNode = useWorkflowStore((state) => state.regenerateNode);
  const isRunning = useWorkflowStore((state) => state.isRunning);

  const handleRegenerate = useCallback(() => {
    regenerateNode(id);
  }, [id, regenerateNode]);

  const isNanoBananaPro = nodeData.model === "nano-banana-pro";

  return (
    <>
      <BaseNode
        id={id}
        title="Generate"
        selected={selected}
        hasError={nodeData.status === "error"}
      >
        {/* Image input - accepts multiple connections */}
        <Handle
          type="target"
          position={Position.Left}
          id="image"
          style={{ top: "35%" }}
          data-handletype="image"
          isConnectable={true}
        />
        {/* Text input - single connection */}
        <Handle
          type="target"
          position={Position.Left}
          id="text"
          style={{ top: "65%" }}
          data-handletype="text"
        />
        {/* Image output */}
        <Handle
          type="source"
          position={Position.Right}
          id="image"
          data-handletype="image"
        />

        <div className="flex-1 flex flex-col min-h-0 gap-2">
          {/* Preview area */}
          {nodeData.outputImage ? (
            <div className="relative w-full flex-1 min-h-0">
              <img
                src={nodeData.outputImage}
                alt="Generated"
                className="w-full h-full object-contain rounded"
              />
              {/* Loading overlay */}
              {nodeData.status === "loading" && (
                <div className="absolute inset-0 bg-neutral-900/70 rounded flex items-center justify-center">
                  <svg
                    className="w-6 h-6 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}
              <div className="absolute top-1 right-1 flex gap-1">
                <button
                  onClick={handleRegenerate}
                  disabled={isRunning}
                  className="w-5 h-5 bg-neutral-900/80 hover:bg-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                  title="Regenerate"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="w-5 h-5 bg-neutral-900/80 hover:bg-green-600/80 rounded flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                  title="View full size"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
                <button
                  onClick={handleClearImage}
                  className="w-5 h-5 bg-neutral-900/80 hover:bg-red-600/80 rounded flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                  title="Clear image"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex-1 min-h-[112px] border border-dashed border-neutral-600 rounded flex flex-col items-center justify-center">
              {nodeData.status === "loading" ? (
                <svg
                  className="w-4 h-4 animate-spin text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : nodeData.status === "error" ? (
                <span className="text-[10px] text-red-400 text-center px-2">
                  {nodeData.error || "Failed"}
                </span>
              ) : (
                <span className="text-neutral-500 text-[10px]">
                  Run to generate
                </span>
              )}
            </div>
          )}

          {/* Model selector */}
          <select
            value={nodeData.model}
            onChange={handleModelChange}
            className="w-full text-[10px] py-1 px-1.5 border border-neutral-700 rounded bg-neutral-900/50 focus:outline-none focus:ring-1 focus:ring-neutral-600 text-neutral-300 shrink-0"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Aspect ratio and resolution row */}
          <div className="flex gap-1.5 shrink-0">
            <select
              value={nodeData.aspectRatio}
              onChange={handleAspectRatioChange}
              className="flex-1 text-[10px] py-1 px-1.5 border border-neutral-700 rounded bg-neutral-900/50 focus:outline-none focus:ring-1 focus:ring-neutral-600 text-neutral-300"
            >
              {ASPECT_RATIO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isNanoBananaPro && (
              <select
                value={nodeData.resolution}
                onChange={handleResolutionChange}
                disabled={nodeData.aspectRatio === "original"}
                className={`w-12 text-[10px] py-1 px-1.5 border border-neutral-700 rounded bg-neutral-900/50 focus:outline-none focus:ring-1 focus:ring-neutral-600 text-neutral-300 ${
                  nodeData.aspectRatio === "original" ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {RESOLUTIONS.map((res) => (
                  <option key={res} value={res}>
                    {res}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Google Search toggle - only for Nano Banana Pro */}
          {isNanoBananaPro && (
            <label className="flex items-center gap-1.5 text-[10px] text-neutral-300 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={nodeData.useGoogleSearch}
                onChange={handleGoogleSearchToggle}
                className="w-3 h-3 rounded border-neutral-700 bg-neutral-900/50 text-neutral-600 focus:ring-1 focus:ring-neutral-600 focus:ring-offset-0"
              />
              <span>Google Search</span>
            </label>
          )}
        </div>
      </BaseNode>
      
      {/* Full size image preview modal using React Portal */}
      {isPreviewModalOpen && nodeData.outputImage && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setIsPreviewModalOpen(false)}
        >
          {/* Close button in top right corner */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewModalOpen(false);
            }}
            className="fixed top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Full screen image container */}
          <img
            src={nodeData.outputImage}
            alt="Generated image full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </>
  );
}
