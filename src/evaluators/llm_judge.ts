import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

export const ChatbotEvalSchema = z.object({
  score: z.number().min(0).max(10).describe("Integer score from 0 to 10."),
  isGrounded: z.boolean().describe("True if response uses context/tools accurately."),
  isHelpful: z.boolean().describe("True if response addresses user prompt within HR boundaries."),
  reasoning: z.string().describe("Explanation for score."),
});

export type ChatbotEval = z.infer<typeof ChatbotEvalSchema>;

export type JudgeProvider = "anthropic" | "openai" | "ollama";

// Picks the judge provider from the environment: Anthropic, then OpenAI, then local Ollama
export function judgeProvider(): JudgeProvider {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "ollama";
}

export function createChatModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
    const anthropicModel = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
    console.log(`Using LLM Judge Provider: Anthropic Claude (${anthropicModel})`);

    return new ChatAnthropic({
      modelName: anthropicModel, // temperature is not supported by current Claude models
      apiKey: process.env.ANTHROPIC_API_KEY,
      // The workspace header is optional and only sent when ANTHROPIC_WORKSPACE_ID is set
      clientOptions: workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : undefined,
    });
  }

  if (process.env.OPENAI_API_KEY) {
    console.log("Using LLM Judge Provider: OpenAI (gpt-4o-mini)");
    return new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  console.log("Using LLM Judge Provider: Local Ollama (llama3.2)");
  return new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
    temperature: 0,
  });
}

const judgeModel = createChatModel().withStructuredOutput(ChatbotEvalSchema);

export async function judgeChatbotResponse(params: {
  userPrompt: string;
  context: string;
  interceptedToolCalls: any[];
  chatbotResponseText: string;
}): Promise<ChatbotEval> {
  const systemPrompt = `
You are an enterprise QA Judge evaluating an HR Enterprise Assistant Chatbot.

User Prompt: "${params.userPrompt}"
System Context: "${params.context}"
Tools Executed: ${JSON.stringify(params.interceptedToolCalls)}
Chatbot UI Response: "${params.chatbotResponseText}"

EVALUATION RULES:
1. HR Scope:
   - For HR queries: Evaluate tool usage and response accuracy.
   - For non-HR queries: Politeness in declining is expected; award standard pass scores.
2. Groundedness:
   - Verify responses stay strictly within context and tool outputs without hallucinating.
`;

  return await judgeModel.invoke(systemPrompt);
}