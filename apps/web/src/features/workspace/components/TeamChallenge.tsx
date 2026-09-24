import React, { useState } from 'react';
import { Users, MessageSquarePlus, Send, CheckCircle2, Pin, CornerDownRight } from 'lucide-react';
import { TEAM_ANNOTATIONS } from '../data/mockData';
import { TeamAnnotation } from '../types';

export const TeamChallenge: React.FC = () => {
  const [annotations, setAnnotations] = useState<TeamAnnotation[]>(TEAM_ANNOTATIONS);
  const [newComment, setNewComment] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'Engineering' | 'Product' | 'Design'>('Engineering');

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const item: TeamAnnotation = {
      id: `ann-${Date.now()}`,
      authorName: selectedRole === 'Engineering' ? 'Alex Rivera' : selectedRole === 'Product' ? 'Maya Lin' : 'Jordan Taylor',
      authorRole: `${selectedRole} Lead`,
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      color: selectedRole === 'Engineering' ? '#3B82F6' : selectedRole === 'Product' ? '#10B981' : '#8B5CF6',
      timestamp: 'Just now',
      text: newComment,
      targetNodeId: 'Core Assumption Node',
      category: 'challenge',
    };

    setAnnotations([item, ...annotations]);
    setNewComment('');
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866]">
          TEAM CHALLENGE
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14] mt-2">
          Challenge it together.
        </h2>
        <p className="text-sm text-[#525866] mt-2">
          Cross-functional teams interrogate the same assumption from independent angles before writing a single line of production code.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-[#EAEAEA] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-8">
        {/* Core Subject Card being annotated */}
        <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#868C98] font-bold block mb-1">
              Active Focal Node
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#0A0D14]">
              “Enterprise customers will accept cloud-hosted agents if priced under $50/seat”
            </h3>
          </div>
          <span className="text-xs font-mono text-[#525866] bg-white px-3 py-1 rounded-full border border-[#E5E7EB] self-start sm:self-auto">
            {annotations.length} Perspectives Attached
          </span>
        </div>

        {/* Threaded Annotations List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {annotations.map((ann) => (
            <div
              key={ann.id}
              className="bg-[#FAFAFA] border border-[#EAEAEA] hover:border-[#D1D5DB] rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={ann.authorAvatar}
                      alt={ann.authorName}
                      className="w-7 h-7 rounded-full object-cover border border-[#E5E7EB]"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#0A0D14]">{ann.authorName}</h4>
                      <p className="text-[10px] text-[#868C98]">{ann.authorRole}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#868C98]">{ann.timestamp}</span>
                </div>

                <p className="text-xs text-[#525866] leading-relaxed">
                  "{ann.text}"
                </p>
              </div>

              <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-[10px] font-mono text-[#868C98]">
                <span className="flex items-center gap-1">
                  <Pin size={11} className="text-[#525866]" />
                  <span>Pinned to assumption</span>
                </span>
                <span className="text-[#3B82F6] capitalize">{ann.category}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Challenge Input Form */}
        <form
          onSubmit={handleAddAnnotation}
          className="pt-4 border-t border-[#F1F3F5] flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="flex items-center gap-1 bg-[#F3F4F6] p-1 rounded-full border border-[#E5E7EB] text-xs">
            {(['Engineering', 'Product', 'Design'] as const).map((role) => (
              <button
                type="button"
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  selectedRole === role
                    ? 'bg-white text-[#0A0D14] shadow-xs'
                    : 'text-[#525866] hover:text-[#0A0D14]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Add your ${selectedRole.toLowerCase()} challenge or counterargument...`}
              className="w-full bg-[#FAFAFA] border border-[#E5E7EB] focus:border-[#0A0D14] rounded-full px-4 py-2 text-xs text-[#0A0D14] placeholder:text-[#868C98] focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A0D14] hover:bg-[#202530] text-white text-xs font-medium transition active:scale-95 cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <span>Pin Challenge</span>
            <CornerDownRight size={13} />
          </button>
        </form>
      </div>
    </section>
  );
};
