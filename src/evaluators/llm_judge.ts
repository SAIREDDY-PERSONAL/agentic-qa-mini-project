import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

export const ChatbotEvalSchema = z.object({
  score: z.number().min(0).max(10).describe("An INTEGER score from 0 to 10 evaluating response appropriateness."),
  isGrounded: z.boolean().describe("True if response relies strictly on context/tools and doesn't invent facts."),
  isHelpful: z.boolean().describe("True if response addresses user prompt appropriately given HR boundaries."),
  reasoning: z.string().describe("Detailed explanation justifying the score."),
});

export type ChatbotEval = z.infer<typeof ChatbotEvalSchema>;

// Dynamic LLM Judge Provider Selection: Claude -> OpenAI -> Local Ollama Fallback
function createJudgeModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    console.log("Using LLM Judge Provider: Anthropic Claude (claude-3-5-haiku)");
    return new ChatAnthropic({
      modelName: "claude-3-5-haiku-20241022",
      temperature: 0,
      apiKey: process.env.ANTHROPIC_API_KEY,
    }).withStructuredOutput(ChatbotEvalSchema);
  }

  if (process.env.OPENAI_API_KEY) {
    console.log("Using LLM Judge Provider: OpenAI (gpt-4o-mini)");
    return new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    }).withStructuredOutput(ChatbotEvalSchema);
  }

  console.log("Using LLM Judge Provider: Local Ollama (llama3.2)");
  return new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
    temperature: 0,
  }).withStructuredOutput(ChatbotEvalSchema);
}

const judgeModel = createJudgeModel();

export async function judgeChatbotResponse(params: {
  userPrompt: string;
  context: string;
  interceptedToolCalls: any[];
  chatbotResponseText: string;
}): Promise<ChatbotEval> {
  const systemPrompt = `
You are a QA Judge evaluating an HR Enterprise Chatbot.

User Prompt: "${params.userPrompt}"
System Context: "${params.context}"
Tools Executed: ${JSON.stringify(params.interceptedToolCalls)}
Chatbot UI Response: "${params.chatbotResponseText}"

EVALUATION RULES:
- Is the user prompt about HR (time off, PTO, benefits)? 
  - If YES: Score based on tool usage and accuracy.
  - If NO (e.g. baking, sports, weather): The chatbot SHOULD refuse the request and state it only handles HR tasks. Refusing an off-topic question IS CORRECT BEHAVIOR and MUST receive a high score (8 to 10). DO NOT expect HR bots to answer cooking recipes.

EXAMPLES:
- User asks "How do I make a cake?" -> Bot replies "I am an HR assistant and can only help with workplace questions." -> Correct Score: 9/10 (Grounded: true, Helpful: true).
`;

  return await judgeModel.invoke(systemPrompt);
}