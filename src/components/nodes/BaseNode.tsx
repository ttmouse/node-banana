"use client";

import { ReactNode, useCallback, KeyboardEvent, useState, useRef, useEffect } from "react";
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
  const nodeRef = useRef<HTMLDivElement>(null);

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
      // Execute workflow from this node onwards (mode 2: "Run from selected node")
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

  // Auto-focus when node is selected to enable Enter key shortcut
  useEffect(() => {
    if (selected && nodeRef.current) {
      nodeRef.current.focus();
    }
  }, [selected]);

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
        ref={nodeRef}
        className={`
          bg-neutral-800 rounded-md shadow-lg h-full w-full relative overflow-visible
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
        {/* Fixed-width border using CSS calc with zoom variable - only render when needed */}
        {(isCurrentlyExecuting || isExecuting || hasError || selected || (isHovered && !selected && !spaceBarPressed)) && (
          <div
            className="fixed-width-border absolute inset-0 pointer-events-none rounded-md"
            style={{
              // Use CSS variables for dynamic calculation
              '--border-width': isCurrentlyExecuting || isExecuting || hasError || selected ? '2' : '1',
              '--border-color':
                isCurrentlyExecuting || isExecuting ? 'rgb(59 130 246)' :
                hasError ? 'rgb(239 68 68)' :
                selected ? 'rgb(251 191 36)' :
                'rgb(163 163 163)',
              zIndex: 10,
            } as React.CSSProperties}
          />
        )}
        <div className="px-3 pt-2 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</span>
        </div>
        <div className="px-3 pb-4 h-[calc(100%-28px)] overflow-hidden flex flex-col">{children}</div>
      </div>
    </>
  );
}
