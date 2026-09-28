import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  FlaskConical, 
  ExternalLink,
  Scale,
  Sparkles,
  User,
  CornerDownRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  NodeComment, 
  NodeDecision, 
  ValidationTest, 
  EvidenceChallenge, 
  CollaboratorPresence 
} from '../../types/collaboration';
import { SourceIconSelector } from '../Icons';

export interface SelectedNodeContext {
  id: string;
  type: 'centralNode' | 'sourceNode' | 'testNode' | 'customNode';
  category: 'IDEA' | 'ASSUMPTION' | 'PROBLEM' | 'USER' | 'EVIDENCE' | 'PRODUCT' | 'UNKNOWN' | 'NEXT_TEST';
  title: string;
  subtitle?: string;
  excerpt?: string;
  relationship?: 'Supports' | 'Challenges' | 'Unknown';
  sourceType?: string;
  sourceIdentifier?: string;
  date?: string;
  url?: string;
  confidence?: number;
  whyItMatters?: string;
  testData?: ValidationTest;
  supportingEvidence?: Array<{ id: string; source: string; excerpt: string; date?: string; url?: string }>;
  contradictingEvidence?: Array<{ id: string; source: string; excerpt: string; date?: string; url?: string }>;
  whatRemainsUnknown?: string;
}

interface NodeDetailDrawerProps {
  node: SelectedNodeContext | null;
  onClose: () => void;
  currentUser: CollaboratorPresence;
  comments: NodeComment[];
  decision?: NodeDecision;
  challenge?: EvidenceChallenge;
  onAddComment: (nodeId: string, text: string, stance?: 'challenge' | 'support' | 'neutral') => void;
  onToggleChallenge: (nodeId: string, reason?: string) => void;
  onRecordDecision: (
    nodeId: string, 
    conclusion: string, 
    rationale: string, 
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW',
    status?: 'CONFIRMED' | 'ABANDONED' | 'NEEDS_VERIFICATION'
  ) => void;
  onCreateTest: (testData: {
    originatingNodeId: string;
    originatingNodeLabel: string;
    question: string;
    method: ValidationTest['method'];
    methodLabel: string;
    target: string;
    successSignal: string;
    scheduledDate: string;
  }) => void;
  onUpdateTestStatus?: (testId: string, status: 'PLANNED' | 'RUNNING' | 'COMPLETED', resultSummary?: string, verdict?: 'SUPPORTS' | 'CHALLENGES' | 'INCONCLUSIVE') => void;
  onNavigateToCalendar?: () => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  onClose,
  currentUser,
  comments,
  decision,
  challenge,
  onAddComment,
  onToggleChallenge,
  onRecordDecision,
  onCreateTest,
  onUpdateTestStatus,
  onNavigateToCalendar,
}) => {
  const [commentText, setCommentText] = useState('');
  const [commentStance, setCommentStance] = useState<'neutral' | 'challenge' | 'support'>('neutral');
  
  // Decision Form State
  const [isDecisionFormOpen, setIsDecisionFormOpen] = useState(false);
  const [decisionConclusion, setDecisionConclusion] = useState('');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [decisionConfidence, setDecisionConfidence] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // Test Creation Form State
  const [isTestFormOpen, setIsTestFormOpen] = useState(false);
  const [testQuestion, setTestQuestion] = useState('');
  const [testMethod, setTestMethod] = useState<ValidationTest['method']>('landing_page_smoke');
  const [testTarget, setTestTarget] = useState('100 targeted practitioners who expressed friction');
  const [testSuccessSignal, setTestSuccessSignal] = useState('>15% conversion to email waitlist with credit card intent');
  const [testDate, setTestDate] = useState('2025-09-24');

  // Test completion state
  const [testResultSummary, setTestResultSummary] = useState('');
  const [testVerdict, setTestVerdict] = useState<'SUPPORTS' | 'CHALLENGES' | 'INCONCLUSIVE'>('SUPPORTS');

  if (!node) return null;

  const isEvidence = node.category === 'EVIDENCE' || node.type === 'sourceNode';
  const isAssumptionOrUnknown = node.category === 'ASSUMPTION' || node.category === 'UNKNOWN' || node.category === 'IDEA' || node.type === 'centralNode';
  const isNextTest = node.category === 'NEXT_TEST' || Boolean(node.testData);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(node.id, commentText, commentStance);
    setCommentText('');
  };

  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionConclusion.trim()) return;
    onRecordDecision(
      node.id, 
      decisionConclusion.trim(), 
      decisionRationale.trim() || 'Recorded from team evidence interrogation.',
      decisionConfidence
    );
    setIsDecisionFormOpen(false);
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    const methodLabels: Record<ValidationTest['method'], string> = {
      landing_page_smoke: 'Landing Page Preorder Smoke Test',
      user_interviews: '5 User Friction Interviews',
      preorder_test: 'Paid Commitment Preorder Test',
      prototype_test: 'Interactive Prototype Audit',
      data_scrape: 'Adversarial Telemetry Scrape',
      live_telemetry: 'Autonomous Browser Session Run',
    };

    onCreateTest({
      originatingNodeId: node.id,
      originatingNodeLabel: node.title,
      question: testQuestion || node.title,
      method: testMethod,
      methodLabel: methodLabels[testMethod],
      target: testTarget,
      successSignal: testSuccessSignal,
      scheduledDate: testDate,
    });
    setIsTestFormOpen(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] md:w-[500px] bg-white border-l border-[#E5E7EB] shadow-2xl flex flex-col font-['Geist','Inter',sans-serif] animate-in slide-in-from-right duration-250 select-none">
      
      {/* DRAWER HEADER */}
      <div className="p-4 sm:p-5 border-b border-[#F1F3F5] flex items-center justify-between bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          {/* Category Tag */}
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
            isNextTest
              ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]'
              : node.relationship === 'Supports'
              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
              : node.relationship === 'Challenges'
              ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]'
              : 'bg-[#F1F3F5] text-[#0A0D14] border border-[#E5E7EB]'
          }`}>
            {node.category || (isNextTest ? 'NEXT TEST' : isEvidence ? 'EVIDENCE' : 'ASSUMPTION')}
          </span>

          {challenge?.challenged && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] text-[10px] font-mono font-bold animate-pulse">
              <AlertTriangle size={11} />
              <span>CHALLENGED</span>
            </span>
          )}

          {decision && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-mono font-bold">
              <CheckCircle2 size={11} />
              <span>DECIDED</span>
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-[#E5E7EB] text-[#64748B] hover:text-[#0A0D14] transition-colors cursor-pointer"
          title="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* DRAWER BODY (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        
        {/* 1. NODE CONTEXT BLOCK */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#868C98]">
            {node.sourceType && <SourceIconSelector type={node.sourceType as any} size={16} />}
            <span className="font-semibold text-[#0A0D14]">{node.sourceIdentifier || node.subtitle || 'Node Detail'}</span>
            {node.date && <span>· {node.date}</span>}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#0A0D14] leading-snug">
            {node.title}
          </h3>

          {node.excerpt && (
            <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] text-xs text-[#334155] leading-relaxed font-mono italic">
              "{node.excerpt}"
            </div>
          )}

          {/* Evidence Meta */}
          {isEvidence && (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB]">
                <span className="text-[#868C98] block text-[10px]">RELATIONSHIP</span>
                <span className={`font-bold ${
                  node.relationship === 'Supports' ? 'text-[#059669]' : 'text-[#E11D48]'
                }`}>
                  {node.relationship === 'Supports' ? '↑ Supports Assumption' : '↓ Challenges Assumption'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB]">
                <span className="text-[#868C98] block text-[10px]">EVIDENCE STRENGTH</span>
                <span className="font-bold text-[#0A0D14]">
                  {node.confidence || 85}% Grounded Signal
                </span>
              </div>
            </div>
          )}

          {/* Why It Matters */}
          {node.whyItMatters && (
            <div className="p-3 rounded-xl bg-[#EFF6FF]/60 border border-[#DBEAFE] text-xs text-[#1E40AF] leading-relaxed">
              <strong className="block font-bold mb-0.5">Why it matters:</strong>
              {node.whyItMatters}
            </div>
          )}

          {/* ASSUMPTION / UNKNOWN REASONING BREAKDOWN */}
          {isAssumptionOrUnknown && (
            <div className="space-y-3 pt-2">
              {/* Supporting Evidence List */}
              {node.supportingEvidence && node.supportingEvidence.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#059669] flex items-center gap-1.5">
                      <TrendingUp size={13} />
                      <span>Supporting Evidence ({node.supportingEvidence.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {node.supportingEvidence.map((sup, idx) => (
                      <div key={sup.id || idx} className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs">
                        <div className="font-semibold text-[#166534] text-[11px] mb-0.5">{sup.source}</div>
                        <p className="text-[#374151] leading-relaxed italic">"{sup.excerpt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contradicting Evidence List */}
              {node.contradictingEvidence && node.contradictingEvidence.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#E11D48] flex items-center gap-1.5">
                      <TrendingDown size={13} />
                      <span>Contradicting Evidence ({node.contradictingEvidence.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {node.contradictingEvidence.map((con, idx) => (
                      <div key={con.id || idx} className="p-2.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs">
                        <div className="font-semibold text-[#9F1239] text-[11px] mb-0.5">{con.source}</div>
                        <p className="text-[#374151] leading-relaxed italic">"{con.excerpt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What Remains Unknown */}
              {node.whatRemainsUnknown && (
                <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-[#B45309] text-[10px] uppercase">
                    <HelpCircle size={12} />
                    <span>What Remains Unknown</span>
                  </div>
                  <p className="text-[#78350F] leading-relaxed font-medium">
                    {node.whatRemainsUnknown}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Challenge Evidence Action */}
          {isEvidence && (
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onToggleChallenge(node.id)}
                className={`text-xs font-mono font-medium px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  challenge?.challenged
                    ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] hover:bg-[#FEE2E2]'
                    : 'bg-white text-[#64748B] hover:text-[#0A0D14] border-[#E5E7EB] hover:border-[#CBD5E1]'
                }`}
              >
                <Scale size={13} />
                <span>{challenge?.challenged ? 'Remove Challenge' : 'Challenge This Evidence'}</span>
              </button>

              {node.url && (
                <a
                  href={node.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-[#0F52BA] hover:underline flex items-center gap-1"
                >
                  <span>Verify Upstream</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* 2. NEXT TEST DETAIL (IF THIS IS A TEST NODE) */}
        {isNextTest && node.testData && (
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] flex items-center gap-1.5">
                <FlaskConical size={13} />
                <span>Active Real-World Experiment</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                node.testData.status === 'COMPLETED'
                  ? 'bg-[#DCFCE7] text-[#166534]'
                  : node.testData.status === 'RUNNING'
                  ? 'bg-[#FEF3C7] text-[#92400E]'
                  : 'bg-[#EFF6FF] text-[#1D4ED8]'
              }`}>
                {node.testData.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-[#0A0D14]">{node.testData.methodLabel}</div>
              <div className="text-[#525866]"><strong>Target:</strong> {node.testData.target}</div>
              <div className="text-[#525866]"><strong>Success Signal:</strong> {node.testData.successSignal}</div>
              <div className="text-[#525866] font-mono"><strong>Scheduled Date:</strong> {node.testData.scheduledDate}</div>
            </div>

            {/* Test completion status control */}
            {node.testData.status !== 'COMPLETED' && onUpdateTestStatus && (
              <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                <span className="text-[11px] font-bold text-[#0A0D14] block">Complete Experiment & Return Result to Graph:</span>
                <input
                  type="text"
                  value={testResultSummary}
                  onChange={(e) => setTestResultSummary(e.target.value)}
                  placeholder="e.g. 19% converted, validating paid commitment"
                  className="w-full text-xs p-2 rounded-xl bg-white border border-[#CBD5E1] focus:outline-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTestVerdict('SUPPORTS')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        testVerdict === 'SUPPORTS' ? 'bg-[#10B981] text-white' : 'bg-white border text-[#525866]'
                      }`}
                    >
                      Supports
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestVerdict('CHALLENGES')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        testVerdict === 'CHALLENGES' ? 'bg-[#EF4444] text-white' : 'bg-white border text-[#525866]'
                      }`}
                    >
                      Challenges
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateTestStatus(node.testData!.id, 'COMPLETED', testResultSummary, testVerdict)}
                    className="px-3 py-1.5 bg-[#0A0D14] hover:bg-[#1E293B] text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Record Verdict
                  </button>
                </div>
              </div>
            )}

            {node.testData.result && (
              <div className="p-3 rounded-xl bg-white border border-[#A7F3D0] space-y-1">
                <span className="text-[10px] font-mono text-[#059669] font-bold block">EXPERIMENT VERDICT: {node.testData.result.verdict}</span>
                <p className="text-xs text-[#0A0D14]">{node.testData.result.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* 3. DECISION BLOCK (IF REACHED CONCLUSION) */}
        {decision && (
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-[#166534] flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>TEAM DECISION RECORDED</span>
              </span>
              <span className="text-[10px] text-[#15803D]">{decision.timestamp} by {decision.author}</span>
            </div>
            <div className="text-sm font-bold text-[#0A0D14] leading-snug">
              {decision.conclusion}
            </div>
            <div className="text-xs text-[#374151] leading-relaxed font-mono">
              {decision.rationale}
            </div>
          </div>
        )}

        {/* 4. ACTIONS FOR ASSUMPTION / UNKNOWN (DECISION & CREATE TEST) */}
        {isAssumptionOrUnknown && !isNextTest && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              {!decision && (
                <button
                  type="button"
                  onClick={() => setIsDecisionFormOpen(!isDecisionFormOpen)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0A0D14] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <CheckCircle2 size={13} className="text-[#10B981]" />
                  <span>{isDecisionFormOpen ? 'Cancel' : 'Record Decision'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsTestFormOpen(!isTestFormOpen)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FlaskConical size={13} className="text-[#38BDF8]" />
                <span>{isTestFormOpen ? 'Cancel' : 'Create Next Test'}</span>
              </button>
            </div>

            {/* Inline Decision Form */}
            {isDecisionFormOpen && (
              <form onSubmit={handleSaveDecision} className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#CBD5E1] space-y-3 text-xs animate-in fade-in duration-150">
                <span className="font-bold text-[#0A0D14] block">Record Team Decision</span>
                <input
                  type="text"
                  value={decisionConclusion}
                  onChange={(e) => setDecisionConclusion(e.target.value)}
                  placeholder="Conclusion (e.g. Pivot to solo professional cooks)"
                  required
                  className="w-full p-2.5 rounded-xl bg-white border border-[#CBD5E1] text-xs text-[#0A0D14] focus:outline-none"
                />
                <textarea
                  value={decisionRationale}
                  onChange={(e) => setDecisionRationale(e.target.value)}
                  placeholder="Rationale backed by evidence..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#CBD5E1] text-xs text-[#0A0D14] focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span>Confidence:</span>
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map((conf) => (
                      <button
                        key={conf}
                        type="button"
                        onClick={() => setDecisionConfidence(conf)}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          decisionConfidence === conf ? 'bg-[#0A0D14] text-white' : 'bg-white border text-[#525866]'
                        }`}
                      >
                        {conf}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold cursor-pointer"
                  >
                    Save Decision
                  </button>
                </div>
              </form>
            )}

            {/* Inline Next Test Creation Form */}
            {isTestFormOpen && (
              <form onSubmit={handleSaveTest} className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-3 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#166534] flex items-center gap-1">
                    <FlaskConical size={13} />
                    <span>Turn Uncertainty into Real-World Experiment</span>
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#15803D] uppercase font-bold block mb-1">
                    Experiment Question:
                  </label>
                  <input
                    type="text"
                    value={testQuestion || node.title}
                    onChange={(e) => setTestQuestion(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl bg-white border border-[#86EFAC] text-xs text-[#0A0D14] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#15803D] uppercase font-bold block mb-1">
                    Experiment Method:
                  </label>
                  <select
                    value={testMethod}
                    onChange={(e) => setTestMethod(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-white border border-[#86EFAC] text-xs text-[#0A0D14] focus:outline-none"
                  >
                    <option value="landing_page_smoke">Landing Page Preorder Smoke Test</option>
                    <option value="user_interviews">5 Problem Interview Sessions</option>
                    <option value="preorder_test">Paid Upfront Deposit Commitments</option>
                    <option value="prototype_test">Interactive Click-Through Prototype Audit</option>
                    <option value="data_scrape">Adversarial Competitor Friction Audit</option>
                    <option value="live_telemetry">Autonomous Browser Usability Run</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#15803D] uppercase font-bold block mb-1">
                    Target Sample / Audience:
                  </label>
                  <input
                    type="text"
                    value={testTarget}
                    onChange={(e) => setTestTarget(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl bg-white border border-[#86EFAC] text-xs text-[#0A0D14] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#15803D] uppercase font-bold block mb-1">
                    Definitive Success Signal:
                  </label>
                  <input
                    type="text"
                    value={testSuccessSignal}
                    onChange={(e) => setTestSuccessSignal(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl bg-white border border-[#86EFAC] text-xs text-[#0A0D14] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-mono text-[#15803D] uppercase font-bold block mb-1">
                      Calendar Date:
                    </label>
                    <input
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white border border-[#86EFAC] text-xs text-[#0A0D14] focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-4 px-4 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white font-semibold text-xs cursor-pointer shadow-xs"
                  >
                    Schedule on Calendar →
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 5. COLLABORATIVE NODE-ATTACHED DISCUSSION */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-[#0A0D14] flex items-center gap-1.5">
              <MessageSquare size={13} className="text-[#0F52BA]" />
              <span>Node Discussion ({comments.length})</span>
            </span>
            <span className="text-[10px] text-[#868C98]">Synced via Realtime</span>
          </div>

          {/* Comment Thread List */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#FAFAFA] border border-dashed border-[#E5E7EB] text-center text-xs text-[#868C98]">
                No comments on this node yet. Challenge the evidence or test assumptions with your team below.
              </div>
            ) : (
              comments.map((comm) => (
                <div 
                  key={comm.id} 
                  className={`p-3 rounded-2xl text-xs space-y-1 border ${
                    comm.stance === 'challenge'
                      ? 'bg-[#FFF1F2] border-[#FECDD3]'
                      : comm.stance === 'support'
                      ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: comm.authorColor || '#3B82F6' }} />
                      <span className="text-[#0A0D14]">{comm.author}</span>
                      {comm.stance === 'challenge' && (
                        <span className="text-[#E11D48] bg-white px-1.5 rounded">CHALLENGE</span>
                      )}
                      {comm.stance === 'support' && (
                        <span className="text-[#059669] bg-white px-1.5 rounded">SUPPORT</span>
                      )}
                    </div>
                    <span className="text-[#868C98]">{comm.timestamp}</span>
                  </div>
                  <p className="text-[#334155] leading-relaxed">
                    {comm.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Comment Composer */}
          <form onSubmit={handleSendComment} className="pt-2 space-y-2">
            {/* Stance Selector */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="text-[#868C98]">Stance:</span>
              <button
                type="button"
                onClick={() => setCommentStance('neutral')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  commentStance === 'neutral' ? 'bg-[#0A0D14] text-white font-bold' : 'bg-[#F1F3F5] text-[#525866]'
                }`}
              >
                Neutral
              </button>
              <button
                type="button"
                onClick={() => setCommentStance('challenge')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  commentStance === 'challenge' ? 'bg-[#EF4444] text-white font-bold' : 'bg-[#F1F3F5] text-[#EF4444]'
                }`}
              >
                Challenge
              </button>
              <button
                type="button"
                onClick={() => setCommentStance('support')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  commentStance === 'support' ? 'bg-[#10B981] text-white font-bold' : 'bg-[#F1F3F5] text-[#10B981]'
                }`}
              >
                Support
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Interrogate this node with collaborators..."
                className="flex-1 p-2.5 rounded-xl bg-[#FAFAFA] border border-[#CBD5E1] text-xs text-[#0A0D14] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0A0D14]"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white disabled:opacity-40 transition-colors cursor-pointer"
                title="Send comment"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* DRAWER FOOTER */}
      <div className="p-3 border-t border-[#F1F3F5] bg-[#FAFAFA] text-[11px] font-mono text-[#868C98] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>Realtime active</span>
        </div>
        {onNavigateToCalendar && (
          <button
            type="button"
            onClick={onNavigateToCalendar}
            className="text-[#0F52BA] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View in Calendar</span>
            <ArrowRight size={11} />
          </button>
        )}
      </div>

    </div>
  );
};
