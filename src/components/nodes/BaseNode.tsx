"use client";

import { ReactNode, useCallback, useState } from "react";
import type { KeyboardEvent } from "react";
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
  const isRunning = useWorkflowStore((state) => state.isRunning);
  const executeWorkflow = useWorkflowStore((state) => state.executeWorkflow);
  const spaceBarPressed = useWorkflowStore((state) => state.spaceBarPressed);
  const isCurrentlyExecuting = currentNodeId === id;
  const { getNodes, setNodes } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);

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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" || event.target !== event.currentTarget || !selected || isRunning) {
        return;
      }

      event.preventDefault();
      executeWorkflow(id);
    },
    [selected, isRunning, executeWorkflow, id]
  );

  const handleMouseEnter = useCallback(() => {
    if (!spaceBarPressed) {
      setIsHovered(true);
    }
  }, [spaceBarPressed]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

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
          bg-neutral-800 rounded-md h-full w-full
          ${isCurrentlyExecuting || isExecuting ? "outline outline-2 outline-blue-500" : ""}
          ${hasError ? "outline outline-2 outline-red-500" : ""}
          ${selected ? "outline outline-2 outline-blue-400" : ""}
          ${isHovered && !selected && !spaceBarPressed ? "outline outline-1 outline-neutral-400" : ""}
          ${className}
        `}
        style={{ 
          cursor: spaceBarPressed ? 'grab' : (isHovered ? 'pointer' : 'default')
        }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="px-3 pt-2 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</span>
        </div>
        <div className="px-3 pb-4 h-[calc(100%-28px)] overflow-hidden flex flex-col">{children}</div>
      </div>
    </>
  );
}
