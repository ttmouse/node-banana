"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FeatureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function FeatureDocsModal({ isOpen, onClose }: FeatureDocsModalProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/FEATURE_CHECKLIST.md")
        .then((res) => res.text())
        .then((text) => {
          setContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load feature docs:", err);
          setContent("# 加载失败\n\n无法加载功能文档，请稍后重试。");
          setLoading(false);
        });
    }
  }, [isOpen]);

  // Parse table of contents from markdown
  const toc = useMemo<TocItem[]>(() => {
    if (!content) return [];
    const headings: TocItem[] = [];
    const lines = content.split("\n");
    const idCounts = new Map<string, number>(); // Track duplicate IDs

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[📚🎯📝🔧]/g, "").trim(); // Remove emoji
        let id = text
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5\s-]/g, "") // Keep Chinese, letters, numbers, spaces, hyphens
          .replace(/\s+/g, "-");

        // Handle duplicate IDs by adding a suffix
        const count = idCounts.get(id) || 0;
        if (count > 0) {
          id = `${id}-${count}`;
        }
        idCounts.set(id.replace(/-\d+$/, ""), count + 1); // Track base ID

        headings.push({ id, text, level });
      }
    }

    return headings;
  }, [content]);

  // Filter content by search query
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return content;

    const query = searchQuery.toLowerCase();
    const lines = content.split("\n");
    const matchedSections: string[] = [];
    let currentSection: string[] = [];
    let inMatchedSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeading = /^#{1,3}\s/.test(line);

      if (isHeading) {
        // Save previous section if it matched
        if (inMatchedSection && currentSection.length > 0) {
          matchedSections.push(currentSection.join("\n"));
        }
        // Start new section
        currentSection = [line];
        inMatchedSection = line.toLowerCase().includes(query);
      } else {
        currentSection.push(line);
        // Check if this line matches
        if (!inMatchedSection && line.toLowerCase().includes(query)) {
          inMatchedSection = true;
        }
      }
    }

    // Add last section if matched
    if (inMatchedSection && currentSection.length > 0) {
      matchedSections.push(currentSection.join("\n"));
    }

    return matchedSections.length > 0
      ? matchedSections.join("\n\n---\n\n")
      : "# 没有找到匹配的内容\n\n请尝试其他关键词。";
  }, [content, searchQuery]);

  // Scroll to section
  const scrollToSection = (id: string) => {
    if (!contentRef.current) return;

    // Find heading element by matching against TOC
    const headings = contentRef.current.querySelectorAll("h1, h2, h3");
    const idCounts = new Map<string, number>();

    for (const heading of Array.from(headings)) {
      const text = heading.textContent?.replace(/[📚🎯📝🔧]/g, "").trim() || "";
      let headingId = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
        .replace(/\s+/g, "-");

      // Apply same duplicate handling as TOC generation
      const count = idCounts.get(headingId) || 0;
      if (count > 0) {
        headingId = `${headingId}-${count}`;
      }
      idCounts.set(headingId.replace(/-\d+$/, ""), count + 1);

      if (headingId === id) {
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSection(id);
        break;
      }
    }
  };

  // Track active section on scroll
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;

    const headingElements = Array.from(contentRef.current.querySelectorAll("h1, h2, h3"));
    const idCounts = new Map<string, number>();

    // Pre-compute heading IDs with same logic as TOC
    const headingIds = headingElements.map((heading) => {
      const text = heading.textContent?.replace(/[📚🎯📝🔧]/g, "").trim() || "";
      let id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
        .replace(/\s+/g, "-");

      const count = idCounts.get(id) || 0;
      if (count > 0) {
        id = `${id}-${count}`;
      }
      idCounts.set(id.replace(/-\d+$/, ""), count + 1);
      return id;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = headingElements.indexOf(entry.target as HTMLElement);
            if (index !== -1) {
              setActiveSection(headingIds[index]);
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: "-100px 0px -80% 0px" }
    );

    headingElements.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [isOpen, filteredContent]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl w-[95vw] h-[95vh] max-w-[1400px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700 shrink-0">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-blue-400"
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
            <h2 className="text-xl font-semibold text-neutral-100">官方功能文档</h2>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="搜索功能..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-2 hover:bg-neutral-800 rounded"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content with sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar TOC */}
          <div className="w-64 border-r border-neutral-700 overflow-y-auto shrink-0 bg-neutral-900/50">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                目录
              </h3>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`
                      block w-full text-left px-3 py-1.5 rounded text-sm transition-colors
                      ${item.level === 1 ? "font-semibold" : ""}
                      ${item.level === 2 ? "pl-6" : ""}
                      ${item.level === 3 ? "pl-9 text-xs" : ""}
                      ${
                        activeSection === item.id
                          ? "bg-blue-600/20 text-blue-400"
                          : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                      }
                    `}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-8 py-6" ref={contentRef}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-neutral-400">加载中...</p>
                </div>
              </div>
            ) : (
              <div className="markdown-content prose prose-invert prose-neutral max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{filteredContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-700 shrink-0 bg-neutral-900/50">
          <p className="text-xs text-neutral-500">
            💡 提示：使用搜索框快速查找功能，点击目录跳转到相应章节
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium text-sm"
          >
            关闭
          </button>
        </div>
      </div>

      {/* Custom Markdown Styles */}
      <style jsx global>{`
        .markdown-content {
          color: #e5e5e5;
        }

        .markdown-content h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #fff;
          border-bottom: 2px solid #404040;
          padding-bottom: 0.5rem;
          scroll-margin-top: 2rem;
        }

        .markdown-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #fff;
          scroll-margin-top: 2rem;
        }

        .markdown-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: #d4d4d4;
          scroll-margin-top: 2rem;
        }

        .markdown-content h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #d4d4d4;
        }

        .markdown-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
        }

        .markdown-content ul,
        .markdown-content ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .markdown-content li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .markdown-content code {
          background: #262626;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #fbbf24;
          border: 1px solid #404040;
        }

        .markdown-content pre {
          background: #171717;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1rem;
          border: 1px solid #262626;
        }

        .markdown-content pre code {
          background: transparent;
          padding: 0;
          border: none;
          color: #e5e5e5;
        }

        .markdown-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #a3a3a3;
          font-style: italic;
        }

        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .markdown-content th,
        .markdown-content td {
          border: 1px solid #404040;
          padding: 0.75rem;
          text-align: left;
        }

        .markdown-content th {
          background: #262626;
          font-weight: 600;
          color: #fff;
        }

        .markdown-content td {
          background: #171717;
        }

        .markdown-content tr:hover td {
          background: #1f1f1f;
        }

        .markdown-content a {
          color: #60a5fa;
          text-decoration: none;
        }

        .markdown-content a:hover {
          text-decoration: underline;
        }

        .markdown-content hr {
          border: none;
          border-top: 1px solid #404040;
          margin: 2rem 0;
        }

        .markdown-content strong {
          font-weight: 600;
          color: #fff;
        }

        .markdown-content em {
          color: #d4d4d4;
        }

        /* Scrollbar styling */
        .markdown-content::-webkit-scrollbar,
        div[class*="overflow-y-auto"]::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .markdown-content::-webkit-scrollbar-track,
        div[class*="overflow-y-auto"]::-webkit-scrollbar-track {
          background: #171717;
        }

        .markdown-content::-webkit-scrollbar-thumb,
        div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 4px;
        }

        .markdown-content::-webkit-scrollbar-thumb:hover,
        div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb:hover {
          background: #525252;
        }
      `}</style>
    </div>
  );
}
