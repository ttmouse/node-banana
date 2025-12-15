"use client";

import { ReactNode, useCallback } from "react";
import { NodeResizer, OnResize, useReactFlow } from "@xyflow/react";
import { useWorkflowStore } from "@/store/workflowStore";

interface BaseNodeProps {
  id: string;
  title: string;
  children: ReactNode;
  selected?: boolean;
  isExecuting?: boolean;
  hasError?: boolean;
  className?: string;
  minWidth?: number;
  minHeight?: number;
}

export function BaseNode({
  id,
  title,
  children,
  selected = false,
  isExecuting = false,
  hasError = false,
  className = "",
  minWidth = 180,
  minHeight = 100,
}: BaseNodeProps) {
  const currentNodeId = useWorkflowStore((state) => state.currentNodeId);
  const isCurrentlyExecuting = currentNodeId === id;
  const { getNodes, setNodes } = useReactFlow();

  // Synchronize resize across all selected nodes
  const handleResize: OnResize = useCallback(
    (event, params) => {
      const allNodes = getNodes();
      const selectedNodes = allNodes.filter((node) => node.selected && node.id !== id);

      if (selectedNodes.length > 0) {
        // Apply the same dimensions to all other selected nodes by updating their style
        setNodes((nodes) =>
          nodes.map((node) => {
            if (node.selected && node.id !== id) {
              return {
                ...node,
                style: {
                  ...node.style,
                  width: params.width,
                  height: params.height,
                },
              };
            }
            return node;
          })
        );
      }
    },
    [id, getNodes, setNodes]
  );

  return (
    <>
      <NodeResizer
        isVisible
        minWidth={minWidth}
        minHeight={minHeight}
        lineClassName="!border-transparent"
        handleClassName="!w-3 !h-3 !bg-transparent !border-none"
        onResize={handleResize}
      />
      <div
        className={`
          bg-neutral-800 rounded-md shadow-lg border h-full w-full
          ${isCurrentlyExecuting || isExecuting ? "border-blue-500 ring-1 ring-blue-500/20" : "border-neutral-700"}
          ${hasError ? "border-red-500" : ""}
          ${selected ? "border-neutral-400 ring-1 ring-neutral-400/30" : ""}
          ${className}
        `}
      >
        <div className="px-3 pt-2 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</span>
        </div>
        <div className="px-3 pb-4 h-[calc(100%-28px)] overflow-hidden flex flex-col">{children}</div>
      </div>
    </>
  );
}
