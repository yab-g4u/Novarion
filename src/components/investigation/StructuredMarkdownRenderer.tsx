import React from 'react';
import { ExternalLink, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Table as TableIcon } from 'lucide-react';

interface StructuredMarkdownRendererProps {
  content: string;
  className?: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

/**
 * Parses inline markdown: bold (**text**), italic (*text*), code (`code`), links ([text](url))
 */
function renderInlineFormatting(text: string): React.ReactNode {
  if (!text) return null;

  // Pattern for links [text](url), bold **text**, inline `code`, and italic *text*
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // 1. Link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const [full, linkText, linkUrl] = linkMatch;
      tokens.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#0F52BA] hover:text-[#1D4ED8] underline font-medium break-all"
        >
          <span>{linkText}</span>
          <ExternalLink size={11} className="inline opacity-70 flex-shrink-0" />
        </a>
      );
      remaining = remaining.slice(full.length);
      continue;
    }

    // 2. Bold **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      const [full, boldContent] = boldMatch;
      tokens.push(
        <strong key={`bold-${keyIndex++}`} className="font-bold text-[#0A0D14]">
          {boldContent}
        </strong>
      );
      remaining = remaining.slice(full.length);
      continue;
    }

    // 3. Inline Code `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      const [full, codeContent] = codeMatch;
      tokens.push(
        <code
          key={`code-${keyIndex++}`}
          className="px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] font-mono text-xs text-[#0F52BA] font-semibold"
        >
          {codeContent}
        </code>
      );
      remaining = remaining.slice(full.length);
      continue;
    }

    // 4. Italic *text* or _text_
    const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/);
    if (italicMatch) {
      const [full, italicContent] = italicMatch;
      tokens.push(
        <em key={`italic-${keyIndex++}`} className="italic text-[#374151]">
          {italicContent}
        </em>
      );
      remaining = remaining.slice(full.length);
      continue;
    }

    // 5. Plain text segment until next special character
    const nextSpecial = remaining.search(/(\[|\*\*|`|\*|_)/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Unmatched marker, consume 1 char safely
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return <>{tokens}</>;
}

/**
 * Checks if a block of lines represents a markdown table
 */
function parseTable(lines: string[]): TableData | null {
  if (lines.length < 2) return null;

  const headerLine = lines[0].trim();
  const dividerLine = lines[1].trim();

  if (!headerLine.startsWith('|') || !dividerLine.startsWith('|')) {
    return null;
  }

  // Verify divider contains ---
  if (!dividerLine.includes('---')) {
    return null;
  }

  const parseCells = (line: string): string[] => {
    return line
      .split('|')
      .slice(1, -1) // remove empty first and last elements caused by outer pipes
      .map((cell) => cell.trim());
  };

  const headers = parseCells(headerLine);
  if (headers.length === 0) return null;

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const rowLine = lines[i].trim();
    if (!rowLine.startsWith('|')) break;
    const cells = parseCells(rowLine);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

export const StructuredMarkdownRenderer: React.FC<StructuredMarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  // Clean raw content of stray escape characters
  const normalized = content
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\r\n/g, '\n');

  const rawLines = normalized.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let elementIndex = 0;

  let lineIdx = 0;
  while (lineIdx < rawLines.length) {
    const line = rawLines[lineIdx];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      lineIdx++;
      continue;
    }

    // 1. Detect Markdown Table
    if (trimmed.startsWith('|') && lineIdx + 1 < rawLines.length && rawLines[lineIdx + 1].includes('---')) {
      const tableLines: string[] = [];
      while (lineIdx < rawLines.length && rawLines[lineIdx].trim().startsWith('|')) {
        tableLines.push(rawLines[lineIdx]);
        lineIdx++;
      }

      const tableData = parseTable(tableLines);
      if (tableData) {
        renderedElements.push(
          <div key={`table-wrapper-${elementIndex++}`} className="my-5 w-full">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#475569] font-mono uppercase tracking-wider text-[11px]">
                    {tableData.headers.map((header, hIdx) => (
                      <th key={`th-${hIdx}`} className="py-2.5 px-3.5 font-bold">
                        {renderInlineFormatting(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {tableData.rows.map((row, rIdx) => (
                    <tr
                      key={`tr-${rIdx}`}
                      className="hover:bg-[#F8FAFC]/80 transition-colors text-[#1E293B]"
                    >
                      {row.map((cell, cIdx) => (
                        <td key={`td-${rIdx}-${cIdx}`} className="py-2.5 px-3.5 leading-relaxed">
                          {renderInlineFormatting(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Stacked Card View */}
            <div className="sm:hidden space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748B] mb-1">
                <TableIcon size={12} className="text-[#0F52BA]" />
                <span>COMPARATIVE DATA SUMMARY</span>
              </div>
              {tableData.rows.map((row, rIdx) => (
                <div
                  key={`mobile-row-${rIdx}`}
                  className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2 text-xs"
                >
                  {row.map((cell, cIdx) => {
                    const headerLabel = tableData.headers[cIdx] || `Field ${cIdx + 1}`;
                    return (
                      <div key={`m-cell-${rIdx}-${cIdx}`} className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold">
                          {headerLabel}
                        </span>
                        <div className="text-[#0A0D14] font-medium leading-snug">
                          {renderInlineFormatting(cell)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
        continue;
      }
    }

    // 2. Headings (### H3, ## H2, # H1)
    if (trimmed.startsWith('### ')) {
      renderedElements.push(
        <div key={`h3-${elementIndex++}`} className="pt-3 pb-1 mt-2 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-[#0F52BA]" />
          <h3 className="text-sm sm:text-base font-bold text-[#0A0D14] tracking-tight">
            {renderInlineFormatting(trimmed.replace(/^###\s+/, ''))}
          </h3>
        </div>
      );
      lineIdx++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      renderedElements.push(
        <div key={`h2-${elementIndex++}`} className="pt-4 pb-1.5 border-b border-[#F1F5F9] mt-3">
          <h2 className="text-base sm:text-lg font-extrabold text-[#0A0D14] tracking-tight">
            {renderInlineFormatting(trimmed.replace(/^##\s+/, ''))}
          </h2>
        </div>
      );
      lineIdx++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      renderedElements.push(
        <div key={`h1-${elementIndex++}`} className="pt-4 pb-2 border-b border-[#E5E7EB] mt-3">
          <h1 className="text-lg sm:text-xl font-extrabold text-[#0A0D14] tracking-tight">
            {renderInlineFormatting(trimmed.replace(/^#\s+/, ''))}
          </h1>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 3. Blockquotes (> text)
    if (trimmed.startsWith('> ')) {
      const quoteText = trimmed.replace(/^>\s+/, '');
      renderedElements.push(
        <div
          key={`quote-${elementIndex++}`}
          className="my-3 pl-3.5 py-1.5 border-l-2 border-[#0F52BA] bg-[#F8FAFC] rounded-r-xl text-xs sm:text-sm italic text-[#334155]"
        >
          {renderInlineFormatting(quoteText)}
        </div>
      );
      lineIdx++;
      continue;
    }

    // 4. Bullet Lists (• , - , * )
    if (/^(\u2022|-|\*)\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (lineIdx < rawLines.length && /^(\u2022|-|\*)\s+/.test(rawLines[lineIdx].trim())) {
        listItems.push(rawLines[lineIdx].trim().replace(/^(\u2022|-|\*)\s+/, ''));
        lineIdx++;
      }

      renderedElements.push(
        <ul key={`ul-${elementIndex++}`} className="space-y-1.5 my-2 pl-1">
          {listItems.map((item, iIdx) => (
            <li key={`li-${iIdx}`} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1E293B] leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F52BA] mt-2 flex-shrink-0" />
              <div className="flex-1">{renderInlineFormatting(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 5. Numbered Lists (1. , 2. )
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: { num: string; text: string }[] = [];
      while (lineIdx < rawLines.length && /^\d+\.\s+/.test(rawLines[lineIdx].trim())) {
        const itemLine = rawLines[lineIdx].trim();
        const numMatch = itemLine.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          listItems.push({ num: numMatch[1], text: numMatch[2] });
        }
        lineIdx++;
      }

      renderedElements.push(
        <ol key={`ol-${elementIndex++}`} className="space-y-2 my-2.5 pl-1">
          {listItems.map((item, iIdx) => (
            <li key={`oli-${iIdx}`} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1E293B] leading-relaxed">
              <span className="w-5 h-5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] font-mono text-[10px] font-bold text-[#0F52BA] flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.num}
              </span>
              <div className="flex-1">{renderInlineFormatting(item.text)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 6. Highlight Verdict Callout (e.g. "**Executive Verdict**: ...")
    if (trimmed.startsWith('**Executive Verdict**:') || trimmed.startsWith('**Verdict**:')) {
      renderedElements.push(
        <div
          key={`verdict-${elementIndex++}`}
          className="my-3 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-start gap-2.5 text-xs sm:text-sm"
        >
          <CheckCircle2 size={16} className="text-[#10B981] flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-[#166534] font-medium leading-relaxed">
            {renderInlineFormatting(trimmed)}
          </div>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 7. Standard Paragraph
    renderedElements.push(
      <p key={`p-${elementIndex++}`} className="text-xs sm:text-sm text-[#1E293B] leading-relaxed my-1.5">
        {renderInlineFormatting(trimmed)}
      </p>
    );
    lineIdx++;
  }

  return <div className={`space-y-1 font-['Inter',sans-serif] ${className}`}>{renderedElements}</div>;
};

export default StructuredMarkdownRenderer;
