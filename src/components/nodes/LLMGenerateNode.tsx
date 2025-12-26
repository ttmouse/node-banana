"use client";

import { useCallback } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store/workflowStore";
import { LLMGenerateNodeData, LLMProvider, LLMModelType } from "@/types";
import { useToast } from "@/components/Toast";

const PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: "google", label: "Google" },
  { value: "openai", label: "OpenAI" },
];

const MODELS: Record<LLMProvider, { value: LLMModelType; label: string }[]> = {
  google: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-3-pro-preview", label: "Gemini 3.0 Pro" },
  ],
  openai: [
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
  ],
};

type LLMGenerateNodeType = Node<LLMGenerateNodeData, "llmGenerate">;

export function LLMGenerateNode({ id, data, selected }: NodeProps<LLMGenerateNodeType>) {
  const nodeData = data;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const handleProviderChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newProvider = e.target.value as LLMProvider;
      const firstModelForProvider = MODELS[newProvider][0].value;
      updateNodeData(id, {
        provider: newProvider,
        model: firstModelForProvider
      });
    },
    [id, updateNodeData]
  );

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { model: e.target.value as LLMModelType });
    },
    [id, updateNodeData]
  );

  const handleTemperatureChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { temperature: parseFloat(e.target.value) });
    },
    [id, updateNodeData]
  );

  const handleMaxTokensChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { maxTokens: parseInt(e.target.value, 10) });
    },
    [id, updateNodeData]
  );

  const regenerateNode = useWorkflowStore((state) => state.regenerateNode);
  const isRunning = useWorkflowStore((state) => state.isRunning);

  const handleRegenerate = useCallback(() => {
    regenerateNode(id);
  }, [id, regenerateNode]);

  const handleClearOutput = useCallback(() => {
    updateNodeData(id, { outputText: null, status: "idle", error: null });
  }, [id, updateNodeData]);

  const handleCopy = useCallback(() => {
    if (nodeData.outputText) {
      navigator.clipboard.writeText(nodeData.outputText);
      useToast.getState().show("Text copied to clipboard", "success");
    }
  }, [nodeData.outputText]);

  const availableModels = MODELS[nodeData.provider];

  return (
    <BaseNode
      id={id}
      title="LLM Generate"
      selected={selected}
      hasError={nodeData.status === "error"}
    >
      {/* Image input */}
      <Handle
        type="target"
        position={Position.Left}
        id="image"
        style={{ top: "30%" }}
        data-handletype="image"
      />

      {/* Text input */}
      <Handle
        type="target"
        position={Position.Left}
        id="text"
        style={{ top: "70%" }}
        data-handletype="text"
      />
      {/* Text output */}
      <Handle
        type="source"
        position={Position.Right}
        id="text"
        data-handletype="text"
      />

      <div className="flex-1 flex flex-col min-h-0 gap-2">
        {/* Output preview area */}
        <div className="relative w-full flex-1 min-h-[80px] border border-dashed border-neutral-600 rounded p-2 overflow-auto">
          {nodeData.status === "loading" ? (
            <div className="h-full flex items-center justify-center">
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
            </div>
          ) : nodeData.status === "error" ? (
            <span className="text-[10px] text-red-400">
              {nodeData.error || "Failed"}
            </span>
          ) : nodeData.outputText ? (
            <>
              <p className="text-[10px] text-neutral-300 whitespace-pre-wrap break-words pr-6">
                {nodeData.outputText}
              </p>
              <div className="absolute top-1 right-1 flex gap-1">
                <button
                  onClick={handleCopy}
                  className="w-5 h-5 bg-neutral-900/80 hover:bg-neutral-700 rounded flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 6V3C7 2.44772 7.44772 2 8 2H20C20.5523 2 21 2.44772 21 3V17C21 17.5523 20.5523 18 20 18H17V21C17 21.5523 16.5523 22 16 22H4C3.44772 22 3 21.5523 3 21V7C3 6.44772 3.44772 6 4 6H7ZM9 6H17V16H19V4H9V6ZM5 8V20H15V8H5Z" />
                  </svg>
                </button>
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
                  onClick={handleClearOutput}
                  className="w-5 h-5 bg-neutral-900/80 hover:bg-red-600/80 rounded flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                  title="Clear output"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-neutral-500 text-[10px]">
                Run to generate
              </span>
            </div>
          )}
        </div>

        {/* Provider selector */}
        <select
          value={nodeData.provider}
          onChange={handleProviderChange}
          className="w-full text-[10px] py-1 px-1.5 border border-neutral-700 rounded bg-neutral-900/50 focus:outline-none focus:ring-1 focus:ring-neutral-600 text-neutral-300 shrink-0"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        {/* Model selector */}
        <select
          value={nodeData.model}
          onChange={handleModelChange}
          className="w-full text-[10px] py-1 px-1.5 border border-neutral-700 rounded bg-neutral-900/50 focus:outline-none focus:ring-1 focus:ring-neutral-600 text-neutral-300 shrink-0"
        >
          {availableModels.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Temperature and Max Tokens row */}
        <div className="flex gap-1.5 shrink-0">
          <div className="flex-1 flex flex-col gap-0.5">
            <label className="text-[9px] text-neutral-500">Temp: {nodeData.temperature.toFixed(1)}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={nodeData.temperature}
              onChange={handleTemperatureChange}
              className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-400"
            />
          </div>
          <select
            value={nodeData.maxTokens}
            onChange={handleMaxTokensChange}
            className="w-16 text-[10px] py-1 px-1 border border-neutral-700 rounded bg-neutral-900/50 focus:outline-none focus:ring-1 focus:ring-neutral-600 text-neutral-300"
            title="Max tokens"
          >
            <option value={256}>256</option>
            <option value={512}>512</option>
            <option value={1024}>1K</option>
            <option value={2048}>2K</option>
            <option value={4096}>4K</option>
          </select>
        </div>
      </div>
    </BaseNode >
  );
}
