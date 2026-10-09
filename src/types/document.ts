export interface ExtractedDocumentContext {
  title: string;
  problem: string;
  targetUsers: string;
  solution: string;
  assumptions: string[];
  features: string[];
  importantClaims: string[];
  competitors?: string[];
  userComplaints?: string[];
  sourceFileName?: string;
  sourceFileType?: 'pdf' | 'prd' | 'markdown' | 'txt' | 'docx' | 'pasted';
  fileSize?: number;
  fullText?: string;
  pageCount?: number;
  charCount?: number;
  synthesizedIdea: string;
  rawTextExcerpt?: string;
  extractedAt?: string;
}

export interface DocumentUploadState {
  file: File | null;
  fileName: string | null;
  fileType: 'pdf' | 'md' | 'txt' | 'docx' | 'pasted' | null;
  isExtracting: boolean;
  error: string | null;
  context: ExtractedDocumentContext | null;
}
