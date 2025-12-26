"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useWorkflowStore } from "@/store/workflowStore";
import { PromptNodeData } from "@/types";
import { useToast } from "@/components/Toast";
import { PROMPT_TEMPLATES } from "@/constants/templates";

type PromptNodeType = Node<PromptNodeData, "prompt">;

export function PromptNode({ id, data, selected }: NodeProps<PromptNodeType>) {
  const nodeData = data;
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-resize textarea logic
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [nodeData.prompt, adjustHeight]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { prompt: e.target.value });
    },
    [id, updateNodeData]
  );

  const handleApplyTemplate = useCallback((templatePrompt: string) => {
    updateNodeData(id, { prompt: templatePrompt });
    setIsMenuOpen(false);
    useToast.getState().show("Template applied", "success");
  }, [id, updateNodeData]);

  return (
    <BaseNode id={id} title="Prompt" selected={selected}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-[9px] text-neutral-500 font-medium">Content</label>
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`text-[9px] flex items-center gap-0.5 transition-colors ${isMenuOpen ? 'text-white' : 'text-blue-400 hover:text-blue-300'}`}
              title="Select a Prompt Template"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Templates
              <svg className={`w-2 h-2 ml-0.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Template Menu */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-neutral-700 rounded shadow-xl z-20 overflow-hidden">
                  <div className="py-1">
                    <div className="px-2 py-1 text-[8px] text-neutral-500 uppercase tracking-wider font-bold border-b border-neutral-800">
                      Quick Templates
                    </div>
                    {PROMPT_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template.prompt)}
                        className="w-full text-left px-3 py-2 text-[10px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-2"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={nodeData.prompt}
          onChange={handleChange}
          placeholder="Describe what to generate..."
          className="nodrag nopan nowheel w-full p-2 text-xs leading-relaxed text-neutral-100 border border-neutral-700 rounded bg-neutral-900/50 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 placeholder:text-neutral-500 overflow-hidden"
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="text"
        data-handletype="text"
      />
    </BaseNode>
  );
}
