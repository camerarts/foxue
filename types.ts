
export enum ProjectStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export interface StoryboardFrame {
  id: string;
  sceneNumber: number;
  originalText?: string;
  description: string;
  imageUrl?: string;
  imagePrompt?: string;
  imageModel?: string;
  timeRange?: string;
  skipGeneration?: boolean;
}

export interface TitleItem {
  mainTitle: string;
  subTitle: string;
  score: number;
}

export interface CoverOption {
  visual: string;
  titleTop: string;
  titleBottom: string;
  score?: number;
}

export interface ProjectData {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: ProjectStatus;
  marked?: boolean;
  moduleTimestamps?: Record<string, number>;
  inputs: {
    topic: string;
    tone: string;
    language: string;
  };
  script?: string;
  storyboard?: StoryboardFrame[];
  titles?: TitleItem[];
  summary?: string;
  coverOptions?: CoverOption[];
  coverImage?: { imageUrl: string };
  audioFile?: string;
}

export interface Inspiration {
  id: string;
  content: string;
  category: string;
  trafficLogic: string;
  viralTitle: string;
  rating?: string;
  marked?: boolean;
  createdAt: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  description: string;
}

export const DEFAULT_PROMPTS: Record<string, PromptTemplate> = {
  SCRIPT: {
    id: 'script_gen',
    name: '视频文案',
    description: '生成完整的视频文案',
    template: `你是一位专业的长视频脚本撰稿人。请为一个视频创作详细的脚本，确保内容深度和逻辑性。
    
主题: {{topic}}
语气风格: {{tone}}
语言: {{language}}

请以Markdown格式返回，必须包含以下部分：
1. 引人入胜的开场（Hook）
2. 核心观点阐述
3. 详细的论证或叙事展开（分章节）
4. 强有力的结论与行动号召（Call to Action）`
  },
  STORYBOARD_TEXT: {
    id: 'sb_text',
    name: '分镜文案提取',
    description: '将脚本拆解为可视化的分镜描述',
    template: `作为一个专业的分镜师，请将以下脚本拆解为一系列视觉画面。
    
**严格要求：**
1. 提取脚本中的每一句或每一段对应的【原文】。
2. 为每一段原文设计具体的、可拍摄的【画面描述】。
3. 严禁包含画质修饰词。
4. 必须使用纯中文描述。

脚本内容:
{{script}}

请仅返回一个纯 JSON 对象数组。每个对象包含字段："original" 和 "description"。`
  },
  TITLES: {
    id: 'titles',
    name: '标题生成',
    description: '基于脚本生成具有病毒传播潜力的标题',
    template: `请基于以下视频脚本，生成 5 组具有病毒传播潜力的爆款标题方案。

主题: {{title}}
脚本内容：{{script}}

**输出格式要求：**
必须仅返回一个 JSON 数组，数组中包含 5 个对象。
每个对象必须包含以下字段：
- "mainTitle": 视觉主标题（2-4字，核心卖点，极具视觉冲击力）
- "subTitle": 心理副标题（6-12字，通过反差、悬念或利益点钩住观众心理）
- "score": 得分（10分制，例如 9.5，基于吸引力评分）

请确保主副标题配合默契，文风高级且具有病毒传播特质。`
  },
  SUMMARY: {
    id: 'summary',
    name: '视频总结',
    description: '生成视频简介和标签',
    template: `你是一位专业的视频运营专家。请为以下脚本撰写适合社交媒体发布的总结内容。
    
脚本内容:
{{script}}

**输出要求：**
请直接输出以下三个部分，确保内容简洁有力，禁止输出任何无关的开场白。

1. 【视频简介】：总结视频核心价值，吸引用户观看（150字左右）。
2. 【内容大纲】：列出视频的3-5个核心看点。
3. 【热门标签】：提供5-8个相关的搜索关键词，以 # 形式展现。`
  },
  COVER_GEN: {
    id: 'cover_gen',
    name: '封面文字策划',
    description: '基于脚本内容生成封面方案',
    template: `你是一名顶尖的短视频封面设计师。请基于以下内容策划 3 个高点击率的封面方案。
    
主题: {{title}}
脚本内容: {{script}}

**输出格式严正声明：**
必须仅输出一个合法的 JSON 数组，严禁输出 Markdown 表格（即严禁使用 | 符号作为格式）。
如果违反此格式，系统将无法解析。

每个对象必须包含：
- "visual": 视觉画面详细描述（主体、表情、氛围）。
- "titleTop": 封面最上方的主标题（短小、冲击力强）。
- "titleBottom": 封面下方的补充文案（反差、结果）。
- "score": 推荐分数(1-100)。`
  }
};
