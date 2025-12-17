"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { NodeType } from "@/types";

// Actions are special menu items that trigger behavior instead of creating a node
export type MenuAction = "splitGrid" | "splitGridCustom";

// State for the grid selector overlay
export interface GridSelectorState {
  position: { x: number; y: number };
  sourceNodeId: string;
  flowPosition: { x: number; y: number };
}

interface MenuOption {
  type: NodeType | MenuAction;
  label: string;
  icon: React.ReactNode;
  isAction?: boolean; // true if this is an action, not a node type
}

// Define which nodes can accept which handle types as inputs
const IMAGE_TARGET_OPTIONS: MenuOption[] = [
  {
    type: "annotation",
    label: "Annotate",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    type: "nanoBanana",
    label: "Generate Image",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    type: "splitGrid",
    label: "Split Image Grid (Auto)",
    isAction: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    type: "splitGridCustom",
    label: "Split Image Grid (Custom)",
    isAction: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.125 0h-7.5A1.125 1.125 0 0112 5.625m0 0V4.875c0-.621.504-1.125 1.125-1.125h7.5c.621 0 1.125.504 1.125 1.125v1.5zM3.375 5.625c0-.621.504-1.125 1.125-1.125h7.5c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-7.5a1.125 1.125 0 01-1.125-1.125v-1.5z" />
      </svg>
    ),
  },
  {
    type: "output",
    label: "Output",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
];

const TEXT_TARGET_OPTIONS: MenuOption[] = [
  {
    type: "nanoBanana",
    label: "Generate Image",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    type: "llmGenerate",
    label: "LLM Generate",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
];

// Define which nodes can provide sources for handle types (when dragging to a target handle)
const IMAGE_SOURCE_OPTIONS: MenuOption[] = [
  {
    type: "imageInput",
    label: "Image Input",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    type: "annotation",
    label: "Annotate",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    type: "nanoBanana",
    label: "Generate Image",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
];

const TEXT_SOURCE_OPTIONS: MenuOption[] = [
  {
    type: "prompt",
    label: "Prompt",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    type: "llmGenerate",
    label: "LLM Generate",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
];

interface ConnectionDropMenuProps {
  position: { x: number; y: number };
  handleType: "image" | "text" | null;
  connectionType: "source" | "target"; // source = dragging from output, target = dragging from input
  onSelect: (selection: { type: NodeType | MenuAction; isAction: boolean }) => void;
  onClose: () => void;
}

export function ConnectionDropMenu({
  position,
  handleType,
  connectionType,
  onSelect,
  onClose,
}: ConnectionDropMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Get the appropriate node options based on handle type and connection direction
  const getOptions = useCallback((): MenuOption[] => {
    if (!handleType) return [];

    if (connectionType === "source") {
      // Dragging from a source handle (output), need nodes with target handles (inputs)
      return handleType === "image" ? IMAGE_TARGET_OPTIONS : TEXT_TARGET_OPTIONS;
    } else {
      // Dragging from a target handle (input), need nodes with source handles (outputs)
      return handleType === "image" ? IMAGE_SOURCE_OPTIONS : TEXT_SOURCE_OPTIONS;
    }
  }, [handleType, connectionType]);

  const options = getOptions();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % options.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
          break;
        case "Enter":
          e.preventDefault();
          if (options[selectedIndex]) {
            onSelect({
              type: options[selectedIndex].type,
              isAction: options[selectedIndex].isAction || false,
            });
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [options, selectedIndex, onSelect, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Focus the menu when it opens
  useEffect(() => {
    menuRef.current?.focus();
  }, []);

  if (options.length === 0) return null;

  return (
    <div
      ref={menuRef}
      tabIndex={-1}
      className="fixed z-100 bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl overflow-hidden min-w-[160px] outline-none"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="px-2 py-1.5 border-b border-neutral-700">
        <span className="text-[10px] text-neutral-400 uppercase tracking-wide">
          Add {handleType} node
        </span>
      </div>
      <div className="py-1">
        {options.map((option, index) => (
          <button
            key={option.type}
            onClick={() => onSelect({ type: option.type, isAction: option.isAction || false })}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full px-3 py-2 text-left text-[11px] font-medium flex items-center gap-2 transition-colors ${
              index === selectedIndex
                ? "bg-neutral-700 text-neutral-100"
                : "text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
      <div className="px-2 py-1.5 border-t border-neutral-700 flex items-center justify-between">
        <span className="text-[9px] text-neutral-500">
          <kbd className="px-1 py-0.5 bg-neutral-700 rounded text-[8px]">↑↓</kbd> navigate
        </span>
        <span className="text-[9px] text-neutral-500">
          <kbd className="px-1 py-0.5 bg-neutral-700 rounded text-[8px]">↵</kbd> select
        </span>
      </div>
    </div>
  );
}

// Grid selector overlay component
export function GridSelectorOverlay({
  position,
  sourceNodeId,
  flowPosition,
  onConfirm,
  onClose,
}: {
  position: { x: number; y: number };
  sourceNodeId: string;
  flowPosition: { x: number; y: number };
  onConfirm: (rows: number, cols: number) => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [isDragging, setIsDragging] = useState(false);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Enter":
          e.preventDefault();
          onConfirm(rows, cols);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [rows, cols, onConfirm, onClose]);

  // Handle mouse drag to select grid size
  const handleCellClick = useCallback((row: number, col: number) => {
    setRows(row + 1);
    setCols(col + 1);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const cellSize = 30; // Each cell is 30px
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newCols = Math.min(6, Math.max(1, Math.ceil(x / cellSize)));
    const newRows = Math.min(6, Math.max(1, Math.ceil(y / cellSize)));

    setCols(newCols);
    setRows(newRows);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isDragging, handleMouseUp]);

  return (
    <div
      ref={overlayRef}
      className="fixed z-100 bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl p-4 outline-none"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        width: "280px",
      }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium text-neutral-200 mb-1">Select Grid Size</h3>
        <p className="text-xs text-neutral-400">Click or drag to select rows and columns</p>
      </div>

      <div 
        ref={gridRef}
        className="mb-4 bg-neutral-900 rounded p-2 cursor-crosshair select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{ userSelect: "none" }}
      >
        <div 
          className="grid gap-1"
          style={{ 
            gridTemplateColumns: `repeat(6, 30px)`,
            gridTemplateRows: `repeat(6, 30px)`
          }}
        >
          {Array.from({ length: 36 }).map((_, index) => {
            const row = Math.floor(index / 6);
            const col = index % 6;
            const isSelected = row < rows && col < cols;

            return (
              <div
                key={index}
                className={`border rounded transition-colors ${
                  isSelected 
                    ? "bg-blue-600 border-blue-500" 
                    : "bg-neutral-800 border-neutral-700"
                }`}
                onClick={() => handleCellClick(row, col)}
                style={{ width: "30px", height: "30px" }}
              />
            );
          })}
        </div>
      </div>

      <div className="mb-4 text-center">
        <span className="text-neutral-300 text-sm font-medium">
          {rows} × {cols} ({rows * cols} images)
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 text-xs font-medium bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(rows, cols)}
          className="flex-1 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Split Image
        </button>
      </div>

      <div className="mt-2 text-center">
        <span className="text-neutral-500 text-[9px]">
          <kbd className="px-1 py-0.5 bg-neutral-700 rounded text-[8px]">ESC</kbd> Cancel
          <span className="mx-2">|</span>
          <kbd className="px-1 py-0.5 bg-neutral-700 rounded text-[8px]">Enter</kbd> Confirm
        </span>
      </div>
    </div>
  );
}
