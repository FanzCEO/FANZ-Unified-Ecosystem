import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface ContentGenerationRequest {
  type: string;
  topic: string;
  tone: string;
  length: number;
  additionalInstructions?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
}

export interface EmailTemplateRequest {
  purpose: string;
  tone: string;
  audience: string;
  keyPoints: string[];
}

export async function generateContent(request: ContentGenerationRequest): Promise<string> {
  const { type, topic, tone, length, additionalInstructions } = request;
  
  let prompt = `Create a ${type} about "${topic}" with a ${tone} tone. `;
  prompt += `The content should be approximately ${length} words. `;
  
  if (additionalInstructions) {
    prompt += `Additional instructions: ${additionalInstructions}. `;
  }
  
  prompt += `Make it engaging, well-structured, and actionable.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: Math.min(4000, Math.max(200, length * 2)),
  });

  return response.choices[0].message.content || "";
}

export async function generateImage(request: ImageGenerationRequest): Promise<{ url: string }> {
  const { prompt, size = "1024x1024" } = request;
  
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: size,
    quality: "standard",
  });

  return { url: response.data?.[0]?.url || "" };
}

export async function generateEmailTemplate(request: EmailTemplateRequest): Promise<{
  subject: string;
  body: string;
}> {
  const { purpose, tone, audience, keyPoints } = request;
  
  const prompt = `Create an email template for ${purpose} with a ${tone} tone targeting ${audience}. 
  Key points to include: ${keyPoints.join(", ")}. 
  
  Please respond with JSON in this format:
  {
    "subject": "compelling subject line",
    "body": "email body with proper formatting and structure"
  }`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert email marketer. Create professional, engaging email templates. Respond with valid JSON only."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return {
    subject: result.subject || "",
    body: result.body || "",
  };
}

export async function enhanceSocialPost(content: string, platform: string): Promise<string> {
  const prompt = `Enhance this social media post for ${platform}. Make it more engaging, add relevant hashtags, and optimize for the platform's best practices while keeping the core message:

"${content}"

Return only the enhanced post text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content || content;
}
