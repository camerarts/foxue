import { GoogleGenAI } from "@google/genai";

// Helper to get the client instance safely at runtime
const getClient = (customApiKey?: string) => {
  // strict adherence to guidelines: API key must be from process.env.API_KEY or custom override
  const apiKey = customApiKey || process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.error("API Key check failed. Value is:", apiKey);
    throw new Error("API Key is missing. Please check your environment configuration in Cloudflare Pages (Settings > Environment variables).");
  }
  
  return new GoogleGenAI({ apiKey });
};

// Retry helper for 503 Overloaded errors with exponential backoff
const retryOperation = async <T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const msg = error.message || error.toString();
    // Retry on 503 (Overloaded) or specific status text
    if (retries > 0 && (msg.includes('503') || msg.includes('Overloaded') || msg.includes('overloaded'))) {
      console.warn(`Model overloaded (503), retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2); // Exponential backoff: 2s, 4s, 8s
    }
    throw error;
  }
};

// Centralized error handler
const handleApiError = (error: any, defaultMsg: string): never => {
  console.error(defaultMsg, error);
  const msg = error.message || error.toString();
  
  // Check for Rate Limiting / Quota issues
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
      throw new Error("API 调用频率过高 (429)。请稍休息 1 分钟等待配额恢复后重试。");
  }

  // Check for Bad Request (400) - often invalid parameters
  if (msg.includes('400') || msg.includes('INVALID_ARGUMENT')) {
      throw new Error("请求参数无效 (400)。可能是提示词内容包含特殊字符，或模型配置不兼容。");
  }

  // Check for Not Found (404) - Model not found or no access
  if (msg.includes('404') || msg.includes('NOT_FOUND')) {
      throw new Error("模型未找到或无权访问 (404)。请检查您的 API Key 是否支持该模型 (gemini-3-pro)，或该区域未开放。");
  }
  
  // Check for Overloaded (503) - Final fallback if retries failed
  if (msg.includes('503') || msg.includes('Overloaded') || msg.includes('overloaded')) {
      throw new Error("模型服务当前繁忙 (503)。已尝试自动重连但仍未成功，请稍休息片刻后再试。");
  }
  
  // Check for Safety Filters (if not caught earlier)
  if (msg.includes('SAFETY') || msg.includes('blocked')) {
      throw new Error("生成内容被 AI 安全策略拦截。请尝试修改提示词或主题。");
  }

  // Return the original message if it's already a clean Error object, otherwise default
  throw new Error(msg || defaultMsg);
};

// UPDATED: Default model changed to gemini-2.5-flash-lite-preview-09-2025
export const generateText = async (prompt: string, customApiKey?: string, modelName: string = 'gemini-2.5-flash-lite-preview-09-2025'): Promise<string> => {
  try {
    if (!prompt || !prompt.trim()) {
       throw new Error("Prompt is empty");
    }
    const ai = getClient(customApiKey);
    
    // Wrap API call with retry mechanism
    const response = await retryOperation(() => ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: prompt }] },
    }));
    
    return response.text || '';
  } catch (error: any) {
    handleApiError(error, "Failed to generate text");
  }
  return ''; // Should be unreachable
};

// UPDATED: Default model changed to gemini-2.5-flash-lite-preview-09-2025
export const generateJSON = async <T>(prompt: string, schema?: any, customApiKey?: string): Promise<T> => {
  try {
    if (!prompt || !prompt.trim()) {
       throw new Error("Prompt is empty");
    }
    const ai = getClient(customApiKey);
    
    // Wrap API call with retry mechanism
    const response = await retryOperation(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-preview-09-2025',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    }));
    
    let text = response.text || '{}';
    
    // Clean Markdown formatting if present (common issue with AI responses)
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    
    return JSON.parse(text) as T;
  } catch (error: any) {
    handleApiError(error, "Failed to generate structured data");
  }
  return {} as T; // Should be unreachable
};

export const generateImage = async (prompt: string, customApiKey?: string, modelName: string = 'gemini-2.5-flash-image'): Promise<string> => {
  try {
    // Pass customApiKey if provided, otherwise uses default from env
    const ai = getClient(customApiKey);
    
    const config: any = {
      imageConfig: {
        aspectRatio: "16:9"
      }
    };

    // Special handling for Pro model: requires imageSize
    if (modelName === 'gemini-3-pro-image-preview') {
       config.imageConfig.imageSize = '1K';
    }

    // Using provided modelName or default, wrapped in retry
    const response = await retryOperation(() => ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: prompt }]
      },
      config: config
    }));

    const candidate = response.candidates?.[0];
    
    // Check for safety blocking or other finish reasons explicitly
    if (candidate?.finishReason === 'SAFETY') {
        throw new Error("图片生成被安全策略拦截 (Safety Filter)。请修改提示词。");
    }
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`生成意外停止: ${candidate.finishReason}`);
    }

    // Extract image
    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("API 未返回图片数据 (Response empty)");
  } catch (error: any) {
    handleApiError(error, "Failed to generate image");
  }
  return ''; // Should be unreachable
};
