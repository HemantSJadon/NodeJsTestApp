"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={`prose-ssb ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-navy-900 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b-2"
              style={{ color: "#1a2744", borderColor: "#c9a84c" }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-5 mb-2" style={{ color: "#1a2744" }}>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mt-3 mb-2 text-slate-700">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-slate-700 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 space-y-1.5 mb-4 text-slate-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 space-y-1.5 mb-4 text-slate-700">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold" style={{ color: "#1a2744" }}>{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-4 pl-4 py-2 my-4 rounded-r-lg italic text-slate-600 bg-amber-50"
              style={{ borderColor: "#c9a84c" }}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl shadow-sm border border-slate-200">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ backgroundColor: "#1a2744", color: "white" }}>{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">{children}</td>
          ),
          tr: ({ children }) => (
            <tr className="even:bg-slate-50 hover:bg-blue-50/30 transition-colors">{children}</tr>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className="rounded-lg p-4 my-4 overflow-x-auto text-sm" style={{ backgroundColor: "#1a2744" }}>
                  <code className="text-slate-100 font-mono">{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-slate-100 text-navy-800 rounded px-1.5 py-0.5 text-sm font-mono">
                {children}
              </code>
            );
          },
          hr: () => <hr className="border-slate-200 my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
