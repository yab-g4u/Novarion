import React, { useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  Layers, 
  ShieldAlert, 
  Compass, 
  ArrowRight,
  TrendingUp,
  Table as TableIcon
} from 'lucide-react';

interface StructuredResponseRendererProps {
  content: string;
  onSelectCitation?: (citation: string) => void;
  className?: string;
}

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

interface ContentBlock {
  type: 'heading' | 'callout' | 'table' | 'list' | 'paragraph' | 'divider';
  level?: number;
  text?: string;
  calloutType?: 'verdict' | 'conflict' | 'consensus' | 'action' | 'info';
  calloutTitle?: string;
  listItems?: { text: string; isOrdered: boolean; number?: number }[];
  table?: ParsedTable;
}

/**
 * Parses markdown inline text: removes raw asterisks, formats bold, italic, code, links, and citations.
 */
export const renderInlineMarkdown = (
  text: string, 
  onSelectCitation?: (cit: string) => void
): React.ReactNode => {
  if (!text) return null;

  // Clean unescaped carriage returns or stray artifacts
  const clean = text.replace(/\\n/g, '\n');

  // Tokenize string for bold, italic, code, links, and citation badges
  const tokens: React.ReactNode[] = [];
  
  // Regex to match:
  // 1. **bold** or __bold__
  // 2. *italic* or _italic_
  // 3. `code`
  // 4. [text](url)
  // 5. [ScholarXIV], [Reddit], [GitHub], [Web], [1], [2] (Citations)
  const pattern = /(\*\*[^*]+\*\*|__[^\_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\)|\[(?:ScholarXIV|Reddit|GitHub|Web|Reviews|arXiv|CHI|\d+)\]|\*[^*]+\*)/g;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(clean)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(clean.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];

    // Bold: **text** or __text__
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      const inner = matchedStr.slice(2, -2);
      tokens.push(
        <strong key={`b-${match.index}`} className="font-bold text-[#0A0D14]">
          {inner}
        </strong>
      );
    } else if (matchedStr.startsWith('__') && matchedStr.endsWith('__')) {
      const inner = matchedStr.slice(2, -2);
      tokens.push(
        <strong key={`b2-${match.index}`} className="font-bold text-[#0A0D14]">
          {inner}
        </strong>
      );
    } 
    // Inline code: `code`
    else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      const inner = matchedStr.slice(1, -1);
      tokens.push(
        <code 
          key={`c-${match.index}`} 
          className="px-1.5 py-0.5 rounded-md bg-[#F1F3F5] text-[#0A0D14] font-mono text-[11px] border border-[#E5E7EB]"
        >
          {inner}
        </code>
      );
    }
    // Markdown link: [text](url)
    else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const closingBracket = matchedStr.indexOf('](');
      const linkText = matchedStr.slice(1, closingBracket);
      const linkUrl = matchedStr.slice(closingBracket + 2, -1);
      tokens.push(
        <a
          key={`l-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0F52BA] hover:text-[#0A3D8F] underline decoration-[#0F52BA]/40 inline-flex items-center gap-0.5 font-medium"
        >
          <span>{linkText}</span>
          <ExternalLink size={10} className="inline ml-0.5 opacity-70" />
        </a>
      );
    }
    // Citation badges: [ScholarXIV], [Reddit], [1], etc.
    else if (matchedStr.startsWith('[') && matchedStr.endsWith(']')) {
      const tag = matchedStr.slice(1, -1);
      const isAcademic = /scholar|arxiv|chi/i.test(tag);
      const isCommunity = /reddit|x|github/i.test(tag);
      const isNumeric = /^\d+$/.test(tag);

      tokens.push(
        <button
          type="button"
          key={`cit-${match.index}`}
          onClick={() => onSelectCitation && onSelectCitation(tag)}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold mx-1 align-baseline transition-all cursor-pointer ${
            isAcademic
              ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] hover:bg-[#E0E7FF]'
              : isCommunity
              ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5] hover:bg-[#FFEDD5]'
              : isNumeric
              ? 'bg-[#F1F3F5] text-[#525866] border border-[#E5E7EB] hover:bg-[#E5E7EB]'
              : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
          }`}
          title={`Evidence Citation: ${tag}`}
        >
          <span>[{tag}]</span>
        </button>
      );
    }
    // Italic: *text*
    else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      const inner = matchedStr.slice(1, -1);
      tokens.push(
        <em key={`i-${match.index}`} className="italic text-[#374151]">
          {inner}
        </em>
      );
    } else {
      tokens.push(matchedStr);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < clean.length) {
    tokens.push(clean.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : clean;
};

/**
 * Checks if a block of lines represents a markdown table
 */
function parseMarkdownTable(lines: string[]): ParsedTable | null {
  if (lines.length < 2) return null;

  const headerLine = lines[0].trim();
  const dividerLine = lines[1].trim();

  if (!headerLine.startsWith('|') || !dividerLine.startsWith('|')) {
    return null;
  }

  if (!dividerLine.includes('---') && !dividerLine.includes('---|')) {
    return null;
  }

  const cleanRow = (rowStr: string): string[] => {
    return rowStr
      .split('|')
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
  };

  const headers = cleanRow(headerLine);
  if (headers.length === 0) return null;

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const rowStr = lines[i].trim();
    if (rowStr.startsWith('|')) {
      const cells = cleanRow(rowStr);
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
  }

  return { headers, rows };
}

/**
 * Parses markdown content into clean structured AST-like blocks.
 */
function parseContentBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const rawLines = content.split('\n');
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Horizontal divider: --- or ***
    if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // 3. Headings: #, ##, ###, ####
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      blocks.push({
        type: 'heading',
        level,
        text
      });
      i++;
      continue;
    }

    // 4. Markdown Table
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
        tableLines.push(rawLines[i]);
        i++;
      }
      const parsed = parseMarkdownTable(tableLines);
      if (parsed) {
        blocks.push({
          type: 'table',
          table: parsed
        });
        continue;
      }
    }

    // 5. Special Callout Banners: Executive Verdict, Fatal Friction, Academic Consensus, Next Action
    const verdictMatch = trimmed.match(/^\*{0,2}(Executive Verdict|Verdict|Fatal Friction|Fatal Risk|Academic Consensus|Practitioner Consensus|Key Takeaway|Recommended Action|Next Action)\*{0,2}\s*:\s*(.+)$/i);
    if (verdictMatch) {
      const title = verdictMatch[1];
      const rest = verdictMatch[2];
      let calloutType: ContentBlock['calloutType'] = 'info';

      if (/verdict/i.test(title)) calloutType = 'verdict';
      else if (/fatal|friction|risk/i.test(title)) calloutType = 'conflict';
      else if (/consensus/i.test(title)) calloutType = 'consensus';
      else if (/action/i.test(title)) calloutType = 'action';

      blocks.push({
        type: 'callout',
        calloutType,
        calloutTitle: title,
        text: rest
      });
      i++;
      continue;
    }

    // 6. Lists: Bullets (•, -, *) or Numbered (1., 2.)
    const isBullet = /^[\*\-\•]\s+(.+)$/.test(trimmed);
    const isNumbered = /^\d+\.\s+(.+)$/.test(trimmed);

    if (isBullet || isNumbered) {
      const listItems: { text: string; isOrdered: boolean; number?: number }[] = [];
      while (i < rawLines.length) {
        const curTrimmed = rawLines[i].trim();
        const bMatch = curTrimmed.match(/^[\*\-\•]\s+(.+)$/);
        const nMatch = curTrimmed.match(/^(\d+)\.\s+(.+)$/);

        if (bMatch) {
          listItems.push({ text: bMatch[1], isOrdered: false });
          i++;
        } else if (nMatch) {
          listItems.push({ text: nMatch[2], isOrdered: true, number: parseInt(nMatch[1], 10) });
          i++;
        } else if (!curTrimmed) {
          // Empty line between items, peek ahead
          if (i + 1 < rawLines.length && /^([\*\-\•]|\d+\.)\s+/.test(rawLines[i + 1].trim())) {
            i++;
            continue;
          }
          break;
        } else {
          break;
        }
      }

      blocks.push({
        type: 'list',
        listItems
      });
      continue;
    }

    // 7. Standard Paragraph
    blocks.push({
      type: 'paragraph',
      text: trimmed
    });
    i++;
  }

  return blocks;
}

/**
 * High-end structured response renderer.
 * Eliminates all raw markdown symbols, renders responsive comparison tables,
 * styled callouts, and elegant typography.
 */
export const StructuredResponseRenderer: React.FC<StructuredResponseRendererProps> = ({
  content,
  onSelectCitation,
  className = ''
}) => {
  const blocks = useMemo(() => parseContentBlocks(content), [content]);

  return (
    <div className={`space-y-3.5 text-[#111827] text-xs sm:text-[13px] leading-relaxed font-['Inter',-apple-system,sans-serif] ${className}`}>
      {blocks.map((block, idx) => {
        // A. Heading rendering
        if (block.type === 'heading') {
          if (block.level === 1 || block.level === 2) {
            return (
              <h2
                key={idx}
                className="text-base sm:text-lg font-extrabold tracking-tight text-[#0A0D14] pt-2 pb-1 border-b border-[#F1F3F5] font-['Geist',sans-serif] flex items-center gap-2"
              >
                <span className="w-1.5 h-4 rounded-full bg-[#0F52BA]" />
                <span>{renderInlineMarkdown(block.text || '', onSelectCitation)}</span>
              </h2>
            );
          }
          if (block.level === 3) {
            return (
              <h3
                key={idx}
                className="text-sm sm:text-base font-bold text-[#0A0D14] pt-1.5 font-['Geist',sans-serif] flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-[#0F52BA]" />
                <span>{renderInlineMarkdown(block.text || '', onSelectCitation)}</span>
              </h3>
            );
          }
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-semibold text-[#0A0D14] pt-1 font-['Geist',sans-serif]"
            >
              {renderInlineMarkdown(block.text || '', onSelectCitation)}
            </h4>
          );
        }

        // B. Callout Banners
        if (block.type === 'callout') {
          const isVerdict = block.calloutType === 'verdict';
          const isConflict = block.calloutType === 'conflict';
          const isConsensus = block.calloutType === 'consensus';
          const isAction = block.calloutType === 'action';

          return (
            <div
              key={idx}
              className={`p-3.5 sm:p-4 rounded-xl border my-2 transition-all shadow-2xs ${
                isVerdict
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                  : isConflict
                  ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                  : isConsensus
                  ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#3730A3]'
                  : isAction
                  ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#1E293B]'
                  : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#111827]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isVerdict && <CheckCircle2 size={16} className="text-[#16A34A] flex-shrink-0 mt-0.5" />}
                {isConflict && <AlertTriangle size={16} className="text-[#E11D48] flex-shrink-0 mt-0.5" />}
                {isConsensus && <Layers size={16} className="text-[#4F46E5] flex-shrink-0 mt-0.5" />}
                {isAction && <Compass size={16} className="text-[#0A0D14] flex-shrink-0 mt-0.5" />}

                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider mb-0.5 opacity-90">
                    {block.calloutTitle}
                  </div>
                  <div className="font-semibold text-xs sm:text-sm leading-snug">
                    {renderInlineMarkdown(block.text || '', onSelectCitation)}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // C. Tables (with Mobile Horizontal Scroll & Stacked Card Support)
        if (block.type === 'table' && block.table) {
          const { headers, rows } = block.table;
          return (
            <div key={idx} className="my-4">
              {/* Table label */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] mb-1.5 px-0.5">
                <div className="flex items-center gap-1.5 font-semibold text-[#0A0D14]">
                  <TableIcon size={12} className="text-[#0F52BA]" />
                  <span>Comparable Structured Data</span>
                </div>
                <span className="sm:hidden text-[10px] text-[#868C98]">Scroll table →</span>
              </div>

              {/* Responsive Container */}
              <div className="w-full overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white shadow-2xs scrollbar-thin">
                <table className="w-full text-left text-xs min-w-[500px] border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      {headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="px-3.5 py-2.5 font-bold text-[#0A0D14] font-['Geist',sans-serif] text-[11px] tracking-tight uppercase"
                        >
                          {renderInlineMarkdown(h, onSelectCitation)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F5]">
                    {rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-[#F8FAFC] transition-colors"
                      >
                        {row.map((cell, cIdx) => {
                          const isFirstCol = cIdx === 0;
                          return (
                            <td
                              key={cIdx}
                              className={`px-3.5 py-2.5 leading-snug ${
                                isFirstCol
                                  ? 'font-semibold text-[#0A0D14]'
                                  : 'text-[#374151]'
                              }`}
                            >
                              {renderInlineMarkdown(cell, onSelectCitation)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        // D. Lists
        if (block.type === 'list' && block.listItems) {
          return (
            <ul key={idx} className="space-y-1.5 my-2 pl-1">
              {block.listItems.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  {item.isOrdered ? (
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#F1F3F5] text-[#525866] flex items-center justify-center text-[10px] font-mono font-bold mt-0.5">
                      {item.number || itemIdx + 1}
                    </span>
                  ) : (
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#0F52BA] mt-2" />
                  )}
                  <span className="min-w-0 flex-1 leading-relaxed">
                    {renderInlineMarkdown(item.text, onSelectCitation)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // E. Horizontal divider
        if (block.type === 'divider') {
          return <hr key={idx} className="my-3 border-[#E5E7EB]" />;
        }

        // F. Paragraph
        return (
          <p key={idx} className="leading-relaxed text-[#374151]">
            {renderInlineMarkdown(block.text || '', onSelectCitation)}
          </p>
        );
      })}
    </div>
  );
};

export default StructuredResponseRenderer;
