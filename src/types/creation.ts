/**
 * 创作页面 - 前端与接口共用类型定义
 * 与 docs/api/creation.md 中的接口契约保持一致
 */

// ========== RAG 知识库 ==========

/** RAG 检索单条结果 */
export interface RagItem {
  id: number;
  title: string;
  content: string;
  /** 相似度 0~1 */
  similarity: number;
  /** 可选：来源标识，用于引用溯源 */
  sourceId?: string;
}

/** RAG 检索请求 */
export interface RagSearchRequest {
  query: string;
  /** 条数，默认 10 */
  limit?: number;
}

/** RAG 检索响应 */
export interface RagSearchResponse {
  items: RagItem[];
}

// ========== 大纲 ==========

/** 大纲单项（可编辑块） */
export interface OutlineItem {
  id: string;
  text: string;
}

/** 流式输出片段（大纲/正文通用，用于前端逐字展示或 SSE 事件） */
export interface StreamSegment {
  /** 关联的 RAG 条目 ID，用于「引用中」高亮 */
  ragId?: number;
  text: string;
}

/** 生成大纲请求 */
export interface OutlineGenerateRequest {
  topic: string;
  /** 希望引用的 RAG 条目 ID 列表，为空则由服务端按检索结果决定 */
  ragIds?: number[];
}

/** 生成大纲响应（非流式时）：返回完整片段列表，前端可做逐字动画 */
export interface OutlineGenerateResponse {
  segments: StreamSegment[];
  /** 解析后的可编辑大纲块（可由服务端从 segments 解析，或前端自行解析） */
  outline?: OutlineItem[];
}

/** 润色大纲项请求 */
export interface OutlineRefineRequest {
  outlineItemId: string;
  currentText: string;
  /** 可选：用户补充的细化要求 */
  hint?: string;
}

/** 润色大纲项响应 */
export interface OutlineRefineResponse {
  refinedText: string;
}

// ========== 正文 ==========

/** 生成正文请求 */
export interface BodyGenerateRequest {
  topic: string;
  outline: OutlineItem[];
  /** 希望引用的 RAG 条目 ID */
  ragIds?: number[];
}

/** 生成正文响应（非流式时） */
export interface BodyGenerateResponse {
  segments: StreamSegment[];
}

// ========== 草稿 ==========

/** 草稿摘要（列表用） */
export interface DraftSummary {
  id: string;
  title: string;
  updatedAt: string; // ISO 8601
}

/** 草稿详情（编辑用） */
export interface DraftDetail {
  id: string;
  title: string;
  content: string;
  /** 当前保存的大纲（若有） */
  outline?: OutlineItem[];
  updatedAt: string;
}

/** 存草稿请求（创建/更新） */
export interface DraftSaveRequest {
  title?: string;
  content?: string;
  outline?: OutlineItem[];
}

/** 存草稿响应 */
export interface DraftSaveResponse {
  id: string;
  updatedAt: string;
}

// ========== 审核 ==========

/** 审核项类型 */
export type AuditTone = 'danger' | 'warning';

/** 单条审核问题 */
export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  tag: string;
  tone: AuditTone;
  /** 可选：在正文中的位置描述，如「第 2 段」 */
  position?: string;
}

/** 审核报告 */
export interface AuditReport {
  sensitive: AuditIssue[];
  factual: AuditIssue[];
}

/** 内容审核请求 */
export interface AuditRequest {
  content: string;
}

/** 内容审核响应 */
export interface AuditResponse {
  report: AuditReport;
}

// ========== 配图 ==========

/** 单张 AI 配图 */
export interface GeneratedImage {
  id: string;
  url: string;
  /** 可选：建议插入位置（段落索引或占位符） */
  suggestedPosition?: number;
}

/** 配图生成请求 */
export interface ImagesGenerateRequest {
  /** 正文内容或草稿 ID，用于理解上下文生成配图 */
  content: string;
  /** 期望数量，默认 2 */
  count?: number;
}

/** 配图生成响应 */
export interface ImagesGenerateResponse {
  images: GeneratedImage[];
}

/** 采用配图请求（将某张图与正文某位置绑定，供发布使用） */
export interface ImageAdoptRequest {
  imageId: string;
  position?: number;
}

// ========== SSE 流式事件（大纲/正文） ==========

export type StreamEventType = 'chunk' | 'segment' | 'cite_start' | 'cite_end' | 'done' | 'error';

export interface StreamEventChunk {
  type: 'chunk';
  text: string;
}

export interface StreamEventSegment {
  type: 'segment';
  index: number;
  ragId?: number;
  text: string;
}

export interface StreamEventCite {
  type: 'cite_start' | 'cite_end';
  ragId: number;
}

export interface StreamEventDone {
  type: 'done';
  /** 可选：完整文本或解析后 outline */
  payload?: string | { outline?: OutlineItem[] };
}

export interface StreamEventError {
  type: 'error';
  code: string;
  message: string;
}

export type StreamEvent =
  | StreamEventChunk
  | StreamEventSegment
  | StreamEventCite
  | StreamEventDone
  | StreamEventError;
