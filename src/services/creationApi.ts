/**
 * 创作页面 API 封装
 * 与 docs/api/creation.md、src/types/creation.ts 保持一致
 * 接口未就绪时可使用 useMock=true 走本地模拟数据
 */

import type {
  RagSearchRequest,
  RagSearchResponse,
  OutlineGenerateRequest,
  OutlineGenerateResponse,
  OutlineRefineRequest,
  OutlineRefineResponse,
  BodyGenerateRequest,
  BodyGenerateResponse,
  DraftSaveRequest,
  DraftSaveResponse,
  DraftDetail,
  AuditRequest,
  AuditResponse,
  ImagesGenerateRequest,
  ImagesGenerateResponse,
  StreamSegment,
  OutlineItem,
} from '@/types/creation';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ---------- RAG ----------

export async function ragSearch(params: RagSearchRequest): Promise<RagSearchResponse> {
  if (USE_MOCK) {
    const topic = params.query.trim() || '热点话题';
    return {
      items: [
        {
          id: 1,
          title: `${topic} · 公开资料摘要`,
          content: '基于公开来源的关键段落摘要（示例），用于快速构建论点与证据链。',
          similarity: 0.93,
        },
        {
          id: 2,
          title: `${topic} · 观点与解读`,
          content: '行业观察/观点摘录（示例），建议用于补充角度与反方论证。',
          similarity: 0.86,
        },
      ],
    };
  }
  return jsonFetch<RagSearchResponse>('/api/rag/search', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ---------- 大纲（非流式） ----------

export async function outlineGenerate(params: OutlineGenerateRequest): Promise<OutlineGenerateResponse> {
  if (USE_MOCK) {
    const topic = params.topic.trim() || '热点话题';
    const segments: StreamSegment[] = [
      {
        ragId: 1,
        text:
          `## 基于「${topic}」的写作大纲\n` +
          `1) 事件概述：关键条款/信号与变化点\n` +
          `2) 背景脉络：政策目标与产业链约束\n` +
          `3) 影响分析：供应链、成本与竞争格局\n` +
          `4) 风险与对策：合规、反爬/数据风险与替代路径\n` +
          `5) 后续跟踪：关键时间点与监测指标\n\n`,
      },
      { ragId: 2, text: '【补充】观点与解读片段引用。\n' },
    ];
    const outline: OutlineItem[] = [
      { id: 'o1', text: '事件概述：关键条款/信号与变化点' },
      { id: 'o2', text: '背景脉络：政策目标与产业链约束' },
      { id: 'o3', text: '影响分析：供应链、成本与竞争格局' },
      { id: 'o4', text: '风险与对策：合规、反爬与替代路径' },
      { id: 'o5', text: '后续跟踪：时间点与监测指标清单' },
    ];
    return { segments, outline };
  }
  return jsonFetch<OutlineGenerateResponse>('/api/creation/outline', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** 流式生成大纲：返回 ReadableStream，前端解析 SSE 或由后端返回 stream */
export function outlineGenerateStream(
  params: OutlineGenerateRequest,
  onEvent: (event: { type: string; [k: string]: unknown }) => void
): () => void {
  if (USE_MOCK) {
    const topic = params.topic.trim() || '热点话题';
    const segments: StreamSegment[] = [
      {
        ragId: 1,
        text:
          `## 基于「${topic}」的写作大纲\n` +
          `1) 事件概述：关键条款/信号与变化点\n` +
          `2) 背景脉络：政策目标与产业链约束\n` +
          `3) 影响分析：供应链、成本与竞争格局\n` +
          `4) 风险与对策：合规、反爬/数据风险与替代路径\n` +
          `5) 后续跟踪：关键时间点与监测指标\n\n`,
      },
      { ragId: 2, text: '【补充】观点与解读片段引用。\n' },
    ];
    let i = 0;
    const timer = window.setInterval(() => {
      if (i < segments.length) {
        const seg = segments[i];
        if (seg.ragId != null) onEvent({ type: 'cite_start', ragId: seg.ragId });
        onEvent({ type: 'segment', index: i, ragId: seg.ragId, text: seg.text });
        if (seg.ragId != null) onEvent({ type: 'cite_end', ragId: seg.ragId });
        i++;
      } else {
        window.clearInterval(timer);
        const outline: OutlineItem[] = [
          { id: 'o1', text: '事件概述：关键条款/信号与变化点' },
          { id: 'o2', text: '背景脉络：政策目标与产业链约束' },
          { id: 'o3', text: '影响分析：供应链、成本与竞争格局' },
          { id: 'o4', text: '风险与对策：合规、反爬与替代路径' },
          { id: 'o5', text: '后续跟踪：时间点与监测指标清单' },
        ];
        onEvent({ type: 'done', payload: { outline } });
      }
    }, 300);
    return () => clearInterval(timer);
  }
  const ac = new AbortController();
  fetch(`${API_BASE}/api/creation/outline/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(params),
    signal: ac.signal,
  })
    .then(async (res) => {
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim()) as { type: string; [k: string]: unknown };
              onEvent(data);
            } catch {
              // ignore
            }
          }
        }
      }
    })
    .catch((e) => {
      if ((e as Error).name !== 'AbortError') onEvent({ type: 'error', code: 'STREAM_ERROR', message: String(e) });
    });
  return () => ac.abort();
}

export async function outlineRefine(params: OutlineRefineRequest): Promise<OutlineRefineResponse> {
  if (USE_MOCK) {
    return {
      refinedText: `${params.currentText}（细化：给出 2 个论点 + 1 个数据/事实依据）`,
    };
  }
  return jsonFetch<OutlineRefineResponse>('/api/creation/outline/refine', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ---------- 正文（非流式） ----------

export async function bodyGenerate(params: BodyGenerateRequest): Promise<BodyGenerateResponse> {
  if (USE_MOCK) {
    const topic = params.topic.trim() || '热点话题';
    const segments: StreamSegment[] = params.outline.map((it, idx) => {
      const title = it.text.replace(/（.*?）$/, '').trim();
      const ragId = idx % 2 === 0 ? 1 : 2;
      return {
        ragId,
        text:
          `### ${title}\n` +
          `围绕「${topic}」，本段聚焦：${title}。建议按“事实依据 → 影响判断 → 可执行建议”的结构展开。\n` +
          `- 事实依据：结合公开资料与已抓取信源进行交叉验证。\n` +
          `- 影响判断：给出 2-3 条行业/市场影响结论。\n` +
          `- 可执行建议：列出 3 条跟踪清单（时间点/指标/触发条件）。\n`,
      };
    });
    return { segments };
  }
  return jsonFetch<BodyGenerateResponse>('/api/creation/body', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** 流式生成正文：同上，onEvent 接收 segment 时 index 对应大纲段落 */
export function bodyGenerateStream(
  params: BodyGenerateRequest,
  onEvent: (event: { type: string; index?: number; ragId?: number; text?: string; payload?: unknown }) => void
): () => void {
  if (USE_MOCK) {
    const topic = params.topic.trim() || '热点话题';
    const segments: StreamSegment[] = params.outline.map((it, idx) => {
      const title = it.text.replace(/（.*?）$/, '').trim();
      const ragId = idx % 2 === 0 ? 1 : 2;
      return {
        ragId,
        text:
          `### ${title}\n` +
          `围绕「${topic}」，本段聚焦：${title}。建议按“事实依据 → 影响判断 → 可执行建议”的结构展开。\n` +
          `- 事实依据：结合公开资料与已抓取信源进行交叉验证。\n` +
          `- 影响判断：给出 2-3 条行业/市场影响结论。\n` +
          `- 可执行建议：列出 3 条跟踪清单（时间点/指标/触发条件）。\n`,
      };
    });
    let i = 0;
    const timer = window.setInterval(() => {
      if (i < segments.length) {
        const seg = segments[i];
        if (seg.ragId != null) onEvent({ type: 'cite_start', ragId: seg.ragId });
        onEvent({ type: 'segment', index: i, ragId: seg.ragId, text: seg.text });
        if (seg.ragId != null) onEvent({ type: 'cite_end', ragId: seg.ragId });
        i++;
      } else {
        window.clearInterval(timer);
        onEvent({ type: 'done' });
      }
    }, 300);
    return () => clearInterval(timer);
  }
  const ac = new AbortController();
  fetch(`${API_BASE}/api/creation/body/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(params),
    signal: ac.signal,
  })
    .then(async (res) => {
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim()) as { type: string; [k: string]: unknown };
              onEvent(data);
            } catch {
              // ignore
            }
          }
        }
      }
    })
    .catch((e) => {
      if ((e as Error).name !== 'AbortError') onEvent({ type: 'error', code: 'STREAM_ERROR', message: String(e) });
    });
  return () => ac.abort();
}

// ---------- 草稿 ----------

export async function draftCreate(payload: DraftSaveRequest): Promise<DraftSaveResponse> {
  if (USE_MOCK) {
    return { id: `draft-${Date.now()}`, updatedAt: new Date().toISOString() };
  }
  const res = await fetch(`${API_BASE}/api/creation/drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<DraftSaveResponse>;
}

export async function draftUpdate(id: string, payload: DraftSaveRequest): Promise<DraftSaveResponse> {
  if (USE_MOCK) {
    return { id, updatedAt: new Date().toISOString() };
  }
  const res = await fetch(`${API_BASE}/api/creation/drafts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<DraftSaveResponse>;
}

export async function draftGet(id: string): Promise<DraftDetail> {
  if (USE_MOCK) {
    return {
      id,
      title: '草稿标题',
      content: '',
      outline: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return jsonFetch<DraftDetail>(`/api/creation/drafts/${encodeURIComponent(id)}`);
}

// ---------- 审核 ----------

export async function auditContent(params: AuditRequest): Promise<AuditResponse> {
  if (USE_MOCK) {
    return {
      report: {
        sensitive: [
          {
            id: 's1',
            title: '"大屠杀"',
            description: '检测到严重暴力倾向词汇，建议拦截。',
            tag: '暴恐违规',
            tone: 'danger',
          },
          {
            id: 's2',
            title: '"绝对领先"',
            description: '夸大/绝对化表述存在合规风险，建议降级语气或补充依据。',
            tag: '夸大表述',
            tone: 'danger',
          },
        ],
        factual: [
          {
            id: 'f1',
            title: '"GDP 15.5%"',
            description: '与公开统计口径对比：去年实际值约为 5.2%，该数据存在虚假夸大风险。',
            tag: '数据存疑',
            tone: 'warning',
          },
        ],
      },
    };
  }
  return jsonFetch<AuditResponse>('/api/creation/audit', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ---------- 配图 ----------

export async function imagesGenerate(params: ImagesGenerateRequest): Promise<ImagesGenerateResponse> {
  if (USE_MOCK) {
    const count = params.count ?? 2;
    return {
      images: Array.from({ length: count }, (_, i) => ({
        id: `img-${Date.now()}-${i}`,
        url: `https://placehold.co/400x300/e2e8f0/64748b?text=AI+Image+${i + 1}`,
        suggestedPosition: i,
      })),
    };
  }
  return jsonFetch<ImagesGenerateResponse>('/api/creation/images/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function imageAdopt(draftId: string, imageId: string, position?: number): Promise<{ ok: boolean }> {
  if (USE_MOCK) return { ok: true };
  return jsonFetch<{ ok: boolean }>(`/api/creation/drafts/${encodeURIComponent(draftId)}/images/adopt`, {
    method: 'POST',
    body: JSON.stringify({ imageId, position }),
  });
}
