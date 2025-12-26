"use client";

import { useState } from "react";
import { FeatureDocsModal } from "./FeatureDocsModal";

export function Header() {
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  return (
    <>
      <header className="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <img src="/banana_icon.png" alt="Banana" className="w-6 h-6" />
          <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">Node Banana</h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Feature Docs Button */}
          <button
            onClick={() => setIsDocsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors group"
            title="功能清单与测试指南"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="hidden sm:inline">功能文档</span>
          </button>

          <a
            href="https://x.com/ReflctWillie"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Made by Willie
          </a>
        </div>
      </header>

      {/* Feature Docs Modal */}
      <FeatureDocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </>
  );
}
