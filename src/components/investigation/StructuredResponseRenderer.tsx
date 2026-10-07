import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  ShieldAlert, 
  Compass, 
  TrendingUp,
  Table as TableIcon,
  HelpCircle,
  ArrowRight,
  Target,
  Lightbulb,
  Search,
  Scale
} from 'lucide-react';

interface StructuredResponseRendererProps {
  content: string;
  onSelectCitation?: (citation: string) => void;
  onSelectAction?: (actionPrompt: string) => void;
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
 * Strips any leftover, dangling, or unclosed raw markdown asterisks/symbols from plain text slices.
 */
function stripStrayMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*{1,4}/g, '')
    .replace(/^#+\s*/g, '')
    .replace(/^[\*\-\•]\s*/g, '');
}

/**
 * Parses markdown inline text: removes raw asterisks, formats bold, italic, code, links, and citations.
 * GUARANTEE: Never renders raw '*' or '**' characters to the screen.
 */
export const renderInlineMarkdown = (
  text: string, 
  onSelectCitation?: (cit: string) => void,
  onSelectAction?: (act: string) => void
): React.ReactNode => {
  if (!text) return null;

  // Clean unescaped carriage returns or stray artifacts
  const clean = text.replace(/\\n/g, '\n');

  // Tokenize string for bold, italic, code, links, citation badges, and Probe action chips
  const tokens: React.ReactNode[] = [];
  
  // Regex to match:
  // 1. **bold** or __bold__
  // 2. `code`
  // 3. [text](url)
  // 4. [ScholarXIV], [Reddit], [GitHub], [Web], [1], [2] (Citations)
  // 5. [Probe pricing], [Try to disprove this], [Find evidence for...] (Interactive Action Chips)
  // 6. *italic* or _italic_
  const pattern = /(\*\*[^*]+\*\*|__[^\_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\)|\[(?:ScholarXIV|Reddit|GitHub|Web|Reviews|arXiv|CHI|\d+)\]|\[(?:Probe|Try to|Find evidence|Explore|Track|Compare|Validation|Design)[^\]]+\]|\*[^*]+\*)/gi;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(clean)) !== null) {
    if (match.index > lastIndex) {
      const slice = stripStrayMarkdown(clean.substring(lastIndex, match.index));
      if (slice) {
        tokens.push(slice);
      }
    }

    const matchedStr = match[0];

    // Bold: **text** or __text__
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      const inner = stripStrayMarkdown(matchedStr.slice(2, -2));
      tokens.push(
        <strong key={`b-${match.index}`} className="font-semibold text-[#0A0D14]">
          {inner}
        </strong>
      );
    } else if (matchedStr.startsWith('__') && matchedStr.endsWith('__')) {
      const inner = stripStrayMarkdown(matchedStr.slice(2, -2));
      tokens.push(
        <strong key={`b2-${match.index}`} className="font-semibold text-[#0A0D14]">
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
          className="px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[#0A0D14] font-mono text-[11px] border border-[#E5E7EB]"
        >
          {inner}
        </code>
      );
    }
    // Markdown link: [text](url)
    else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const closingBracket = matchedStr.indexOf('](');
      const linkText = stripStrayMarkdown(matchedStr.slice(1, closingBracket));
      const linkUrl = matchedStr.slice(closingBracket + 2, -1);
      tokens.push(
        <a
          key={`l-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0091FF] hover:text-[#0F52BA] underline decoration-[#0091FF]/40 inline-flex items-center gap-0.5 font-medium"
        >
          <span>{linkText}</span>
          <ExternalLink size={10} className="inline ml-0.5 opacity-70" />
        </a>
      );
    }
    // Interactive Probe Action Chips: [Probe pricing], [Try to disprove this], etc.
    else if (
      matchedStr.startsWith('[') && 
      matchedStr.endsWith(']') && 
      /^(probe|try to|find evidence|explore|track|compare|validation|design)/i.test(matchedStr.slice(1, -1))
    ) {
      const actionLabel = matchedStr.slice(1, -1);
      tokens.push(
        <button
          type="button"
          key={`act-${match.index}`}
          onClick={() => onSelectAction && onSelectAction(actionLabel)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#0A0D14]/20 hover:border-[#0A0D14] hover:bg-[#F8FAFC] text-[#0A0D14] text-xs font-semibold shadow-2xs transition-all cursor-pointer mr-2 my-1 active:scale-95 group select-none"
          title={`Execute: ${actionLabel}`}
        >
          <Sparkles size={11} className="text-[#0091FF] group-hover:rotate-12 transition-transform shrink-0" />
          <span className="font-['Geist',sans-serif]">{actionLabel}</span>
          <ArrowRight size={10} className="text-[#9CA3AF] group-hover:text-[#0A0D14] transition-colors shrink-0" />
        </button>
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
          title={`View citation details: ${tag}`}
        >
          <span>[{tag}]</span>
        </button>
      );
    }
    // Italic: *text*
    else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      const inner = stripStrayMarkdown(matchedStr.slice(1, -1));
      tokens.push(
        <em key={`i-${match.index}`} className="italic text-[#374151]">
          {inner}
        </em>
      );
    } else {
      tokens.push(stripStrayMarkdown(matchedStr));
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < clean.length) {
    const trailing = stripStrayMarkdown(clean.substring(lastIndex));
    if (trailing) {
      tokens.push(trailing);
    }
  }

  return tokens.length > 0 ? tokens : stripStrayMarkdown(clean);
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
      .map((c) => stripStrayMarkdown(c.trim()))
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
      const text = stripStrayMarkdown(headingMatch[2]);
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
      const title = stripStrayMarkdown(verdictMatch[1]);
      const rest = stripStrayMarkdown(verdictMatch[2]);
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
          listItems.push({ text: stripStrayMarkdown(bMatch[1]), isOrdered: false });
          i++;
        } else if (nMatch) {
          listItems.push({ text: stripStrayMarkdown(nMatch[2]), isOrdered: true, number: parseInt(nMatch[1], 10) });
          i++;
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

    // 7. General Paragraph
    blocks.push({
      type: 'paragraph',
      text: stripStrayMarkdown(trimmed)
    });
    i++;
  }

  return blocks;
}

export const StructuredResponseRenderer: React.FC<StructuredResponseRendererProps> = ({
  content,
  onSelectCitation,
  onSelectAction,
  className = ''
}) => {
  const blocks = React.useMemo(() => parseContentBlocks(content), [content]);

  const getSectionIcon = (headingText: string) => {
    const h = headingText.toLowerCase();
    if (h.includes('what people are saying') || h.includes('discourse') || h.includes('conversation')) {
      return <Search size={15} className="text-[#0091FF] shrink-0" />;
    }
    if (h.includes('problem') || h.includes('friction') || h.includes('pain')) {
      return <AlertTriangle size={15} className="text-[#EF4444] shrink-0" />;
    }
    if (h.includes('how people solve') || h.includes('competitor') || h.includes('today')) {
      return <Target size={15} className="text-[#D97706] shrink-0" />;
    }
    if (h.includes('insight') || h.includes('overlooked')) {
      return <Lightbulb size={15} className="text-[#F59E0B] shrink-0" />;
    }
    if (h.includes('ideas') || h.includes('exploring') || h.includes('concept')) {
      return <Sparkles size={15} className="text-[#8B5CF6] shrink-0" />;
    }
    if (h.includes('pressure test') || h.includes('disprove') || h.includes('fail') || h.includes('threat')) {
      return <ShieldAlert size={15} className="text-[#DC2626] shrink-0" />;
    }
    if (h.includes('recommended') || h.includes('direction') || h.includes('verdict')) {
      return <CheckCircle2 size={15} className="text-[#10B981] shrink-0" />;
    }
    if (h.includes('product requirements') || h.includes('prd') || h.includes('scope')) {
      return <FileText size={15} className="text-[#0091FF] shrink-0" />;
    }
    if (h.includes('change this') || h.includes('change your mind') || h.includes('falsif')) {
      return <Scale size={15} className="text-[#6366F1] shrink-0" />;
    }
    return <Compass size={15} className="text-[#0A0D14] shrink-0" />;
  };

  return (
    <div className={`space-y-4 text-xs sm:text-sm text-[#1F242F] font-['Inter',sans-serif] leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        // A. Headings
        if (block.type === 'heading') {
          const isFalsification = (block.text || '').toLowerCase().includes('change this') || (block.text || '').toLowerCase().includes('change your mind');

          if (block.level === 1) {
            return (
              <div key={idx} className={`pt-5 pb-2 ${isFalsification ? 'p-3.5 my-3 rounded-2xl bg-[#EEF2FF]/40 border border-[#C7D2FE]' : 'border-b border-[#F0F2F5]'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    {getSectionIcon(block.text || '')}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-[#0A0D14] font-['Geist',sans-serif] tracking-tight">
                    {renderInlineMarkdown(block.text || '', onSelectCitation, onSelectAction)}
                  </h2>
                </div>
                {isFalsification && (
                  <p className="text-[11px] text-[#6366F1] font-mono mt-1 pl-8">
                    Intellectual Falsification: What empirical signals would prove this recommendation wrong?
                  </p>
                )}
              </div>
            );
          }
          if (block.level === 2) {
            return (
              <h3 key={idx} className="text-xs sm:text-sm font-bold text-[#0A0D14] pt-3 pb-1 tracking-tight flex items-center gap-2 font-['Geist',sans-serif]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0091FF] shrink-0" />
                <span>{renderInlineMarkdown(block.text || '', onSelectCitation, onSelectAction)}</span>
              </h3>
            );
          }
          return (
            <h4 key={idx} className="text-xs font-semibold text-[#0A0D14] pt-2 font-['Geist',sans-serif]">
              {renderInlineMarkdown(block.text || '', onSelectCitation, onSelectAction)}
            </h4>
          );
        }

        // B. Special Callout Banners
        if (block.type === 'callout') {
          const type = block.calloutType || 'info';
          let borderClass = 'border-[#E5E7EB] bg-[#F8FAFC] text-[#0A0D14]';
          let icon = <Sparkles size={14} className="text-[#0091FF] shrink-0" />;

          if (type === 'verdict') {
            borderClass = 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]';
            icon = <CheckCircle2 size={15} className="text-[#2563EB] shrink-0" />;
          } else if (type === 'conflict') {
            borderClass = 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]';
            icon = <ShieldAlert size={15} className="text-[#DC2626] shrink-0" />;
          } else if (type === 'consensus') {
            borderClass = 'border-[#C7D2FE] bg-[#EEF2FF] text-[#3730A3]';
            icon = <CheckCircle2 size={15} className="text-[#4F46E5] shrink-0" />;
          } else if (type === 'action') {
            borderClass = 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]';
            icon = <Compass size={15} className="text-[#16A34A] shrink-0" />;
          }

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 transition-all shadow-2xs my-2 ${borderClass}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block opacity-75">
                  {block.calloutTitle}
                </span>
                <p className="font-medium text-xs sm:text-sm mt-0.5 leading-snug">
                  {renderInlineMarkdown(block.text || '', onSelectCitation, onSelectAction)}
                </p>
              </div>
            </div>
          );
        }

        // C. Tables (Responsive comparison / pricing table)
        if (block.type === 'table' && block.table) {
          const { headers, rows } = block.table;
          return (
            <div key={idx} className="my-3 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#525866] font-mono text-[10px] uppercase font-bold tracking-wider">
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3.5 py-2.5 font-semibold">
                          {renderInlineMarkdown(h, onSelectCitation, onSelectAction)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F5]">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        {row.map((cell, cIdx) => {
                          const isFirstCol = cIdx === 0;
                          return (
                            <td
                              key={cIdx}
                              className={`px-3.5 py-2.5 leading-snug ${
                                isFirstCol ? 'font-semibold text-[#0A0D14]' : 'text-[#374151]'
                              }`}
                            >
                              {renderInlineMarkdown(cell, onSelectCitation, onSelectAction)}
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
                    <span className="shrink-0 w-4 h-4 rounded-full bg-[#F1F3F5] text-[#525866] flex items-center justify-center text-[10px] font-mono font-bold mt-0.5">
                      {item.number || itemIdx + 1}
                    </span>
                  ) : (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#0091FF] mt-2" />
                  )}
                  <span className="min-w-0 flex-1 leading-relaxed">
                    {renderInlineMarkdown(item.text, onSelectCitation, onSelectAction)}
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
            {renderInlineMarkdown(block.text || '', onSelectCitation, onSelectAction)}
          </p>
        );
      })}
    </div>
  );
};

export default StructuredResponseRenderer;
