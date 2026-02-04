# 创作页面 API 文档

**模块**：创作工作台（Editor）  
**基础路径**：`/api`（可配置）  
**约定**：除流式接口外，请求/响应均为 JSON；错误统一返回 `{ code, message }`，HTTP 状态码 4xx/5xx。

---

## 一、RAG 知识库检索

创作页左侧「RAG 知识库」根据当前选题/热点检索知识库，供大纲与正文引用。

### 1.1 检索

**POST** `/api/rag/search`

**请求体**

| 字段   | 类型   | 必填 | 说明           |
|--------|--------|------|----------------|
| query  | string | 是   | 检索关键词（选题/热点） |
| limit  | number | 否   | 返回条数，默认 10      |

**响应** `200`

```json
{
  "items": [
    {
      "id": 1,
      "title": "2026 半导体协定全文",
      "content": "协定第三章明确了关于出口管制的豁免条款...",
      "similarity": 0.94,
      "sourceId": "doc-001"
    }
  ]
}
```

| 字段        | 类型   | 说明                    |
|-------------|--------|-------------------------|
| items[].id  | number | 唯一 ID，用于引用与流式 cite |
| items[].title | string | 标题/来源描述           |
| items[].content | string | 片段正文               |
| items[].similarity | number | 相似度 0~1          |
| items[].sourceId | string | 可选，溯源用           |

---

## 二、大纲生成

步骤 2「大纲生成」：根据选题 + 可选 RAG 引用，流式生成大纲；支持「非流式」一次返回片段，由前端做逐字动画。

### 2.1 生成大纲（推荐流式）

**POST** `/api/creation/outline/stream`

**Content-Type**：`application/json`  
**Accept**：`text/event-stream`

**请求体**

| 字段   | 类型     | 必填 | 说明                          |
|--------|----------|------|-------------------------------|
| topic  | string   | 是   | 热点/选题                      |
| ragIds | number[] | 否   | 希望引用的 RAG 条目 ID，空则服务端自选 |

**SSE 事件约定**

- 每行一条事件，格式：`data: <JSON>`
- 事件类型见下表。

| type       | 说明           | 额外字段 |
|-----------|----------------|----------|
| chunk     | 普通文本块     | `text: string` |
| segment   | 一段完整片段（可带引用） | `index: number`, `ragId?: number`, `text: string` |
| cite_start| 开始引用某 RAG | `ragId: number` |
| cite_end  | 结束引用       | `ragId: number` |
| done      | 结束           | `payload?: string \| { outline?: OutlineItem[] }` |
| error     | 错误           | `code: string`, `message: string` |

**OutlineItem**：`{ id: string, text: string }`

**示例**

```
data: {"type":"segment","index":0,"ragId":1,"text":"## 基于「半导体贸易协定」的写作大纲\n1) 事件概述：关键条款/信号与变化点\n"}

data: {"type":"cite_end","ragId":1}

data: {"type":"segment","index":1,"text":"2) 背景脉络：政策目标与产业链约束\n"}

data: {"type":"done","payload":{"outline":[{"id":"o1","text":"事件概述：关键条款/信号与变化点"},{"id":"o2","text":"背景脉络：政策目标与产业链约束"}]}}
```

### 2.2 生成大纲（非流式）

**POST** `/api/creation/outline`

**请求体**：同 2.1（topic, ragIds?）。

**响应** `200`

```json
{
  "segments": [
    { "ragId": 1, "text": "## 基于「xxx」的写作大纲\n1) 事件概述：..." },
    { "text": "2) 背景脉络：..." }
  ],
  "outline": [
    { "id": "o1", "text": "事件概述：关键条款/信号与变化点" },
    { "id": "o2", "text": "背景脉络：政策目标与产业链约束" }
  ]
}
```

前端可用 `segments` 做逐字播放，用 `outline` 直接进入块编辑。

### 2.3 润色大纲项

**POST** `/api/creation/outline/refine`

**请求体**

| 字段           | 类型   | 必填 | 说明           |
|----------------|--------|------|----------------|
| outlineItemId  | string | 是   | 当前条目 ID    |
| currentText    | string | 是   | 当前文案       |
| hint           | string | 否   | 用户补充要求   |

**响应** `200`

```json
{
  "refinedText": "事件概述：关键条款/信号与变化点（细化：给出 2 个论点 + 1 个数据/事实依据）"
}
```

---

## 三、正文生成

步骤 3「正文创作」：按确认后的大纲逐段流式生成正文。

### 3.1 生成正文（推荐流式）

**POST** `/api/creation/body/stream`

**Content-Type**：`application/json`  
**Accept**：`text/event-stream`

**请求体**

| 字段   | 类型          | 必填 | 说明              |
|--------|---------------|------|-------------------|
| topic  | string        | 是   | 选题              |
| outline| OutlineItem[] | 是   | 已确认的大纲块    |
| ragIds | number[]      | 否   | 希望引用的 RAG ID |

**SSE 事件**：与「大纲生成」相同约定（chunk / segment / cite_start / cite_end / done / error）。  
`segment.index` 对应大纲段落序号，前端可用来高亮左侧大纲当前段。

### 3.2 生成正文（非流式）

**POST** `/api/creation/body`

**请求体**：同 3.1。

**响应** `200`

```json
{
  "segments": [
    { "ragId": 1, "text": "### 事件概述\n围绕「半导体贸易协定」..." },
    { "ragId": 2, "text": "\n### 背景脉络\n..." }
  ]
}
```

---

## 四、草稿

支持存草稿、拉取草稿（用于「上次保存」、从草稿继续编辑）。

### 4.1 创建草稿

**POST** `/api/creation/drafts`

**请求体**

| 字段    | 类型          | 必填 | 说明     |
|---------|---------------|------|----------|
| title   | string        | 否   | 标题     |
| content | string        | 否   | 正文     |
| outline | OutlineItem[] | 否   | 大纲     |

**响应** `201`

```json
{
  "id": "draft-uuid",
  "updatedAt": "2025-02-03T14:20:05.000Z"
}
```

### 4.2 更新草稿

**PUT** `/api/creation/drafts/:id`

**请求体**：同 4.1（均为可选，只传需要更新的字段）。

**响应** `200`

```json
{
  "id": "draft-uuid",
  "updatedAt": "2025-02-03T14:25:00.000Z"
}
```

### 4.3 获取草稿详情

**GET** `/api/creation/drafts/:id`

**响应** `200`

```json
{
  "id": "draft-uuid",
  "title": "半导体贸易协定解读",
  "content": "正文全文...",
  "outline": [
    { "id": "o1", "text": "事件概述：关键条款/信号与变化点" }
  ],
  "updatedAt": "2025-02-03T14:25:00.000Z"
}
```

### 4.4 草稿列表（可选）

**GET** `/api/creation/drafts?page=1&pageSize=20`

**响应** `200`

```json
{
  "list": [
    {
      "id": "draft-uuid",
      "title": "半导体贸易协定解读",
      "updatedAt": "2025-02-03T14:25:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 五、内容审核

步骤 4「配图/审核」：右侧自动审核报告（敏感词 + 事实性检查）。

### 5.1 提交审核

**POST** `/api/creation/audit`

**请求体**

| 字段    | 类型   | 必填 | 说明   |
|---------|--------|------|--------|
| content | string | 是   | 正文全文 |

**响应** `200`

```json
{
  "report": {
    "sensitive": [
      {
        "id": "s1",
        "title": "\"大屠杀\"",
        "description": "检测到严重暴力倾向词汇，建议拦截。",
        "tag": "暴恐违规",
        "tone": "danger",
        "position": "第 2 段"
      }
    ],
    "factual": [
      {
        "id": "f1",
        "title": "\"GDP 15.5%\"",
        "description": "与公开统计口径对比：去年实际值约为 5.2%，该数据存在虚假夸大风险。",
        "tag": "数据存疑",
        "tone": "warning",
        "position": "第 3 段"
      }
    ]
  }
}
```

| 字段        | 说明 |
|-------------|------|
| tone        | `danger`：敏感词/违规；`warning`：事实性/表述风险 |
| position    | 可选，在正文中的位置描述 |

---

## 六、配图

步骤 4「自动化配图」：根据正文生成配图、采用某张图。

### 6.1 生成配图

**POST** `/api/creation/images/generate`

**请求体**

| 字段   | 类型   | 必填 | 说明         |
|--------|--------|------|--------------|
| content| string | 是   | 正文或段落   |
| count  | number | 否   | 生成张数，默认 2 |

**响应** `200`

```json
{
  "images": [
    {
      "id": "img-uuid-1",
      "url": "https://cdn.example.com/gen/xxx.png",
      "suggestedPosition": 0
    }
  ]
}
```

### 6.2 采用配图（绑定到草稿/文章）

**POST** `/api/creation/drafts/:draftId/images/adopt`

**请求体**

| 字段     | 类型   | 必填 | 说明           |
|----------|--------|------|----------------|
| imageId  | string | 是   | 生成的图片 ID  |
| position | number | 否   | 插入段落位置   |

**响应** `200`

```json
{
  "ok": true
}
```

---

## 七、错误码约定

| HTTP | code       | 说明           |
|------|------------|----------------|
| 400  | BAD_REQUEST | 参数校验失败   |
| 401  | UNAUTHORIZED | 未登录         |
| 404  | NOT_FOUND   | 草稿/资源不存在 |
| 429  | RATE_LIMIT  | 流式/生成类限流 |
| 500  | INTERNAL    | 服务端错误     |

流式接口中错误通过 SSE 事件 `type: "error"` 推送，并建议关闭流。

---

## 八、前端字段与类型映射

前端类型定义见 `src/types/creation.ts`，与上述接口一一对应：

- RAG：`RagItem`, `RagSearchRequest`, `RagSearchResponse`
- 大纲：`OutlineItem`, `StreamSegment`, `OutlineGenerateRequest/Response`, `OutlineRefineRequest/Response`
- 正文：`BodyGenerateRequest/Response`
- 草稿：`DraftSummary`, `DraftDetail`, `DraftSaveRequest/Response`
- 审核：`AuditIssue`, `AuditReport`, `AuditRequest/Response`
- 配图：`GeneratedImage`, `ImagesGenerateRequest/Response`, `ImageAdoptRequest`
- 流式：`StreamEvent*` 系列

接口对接时在 `src/services/` 下封装 HTTP/SSE 调用，并统一使用上述类型，便于后续后端联调与替换 mock。
