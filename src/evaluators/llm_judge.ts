import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Define structured response schema using Zod
export const ChatbotEvalSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(10)
    .describe("An INTEGER score from 0 to 10 evaluating response appropriateness."),
  isGrounded: z
    .boolean()
    .describe("True if response relies strictly on context/tools and doesn't invent facts."),
  isHelpful: z
    .boolean()
    .describe("True if response addresses user prompt appropriately given HR boundaries."),
  reasoning: z.string().describe("Detailed explanation justifying the score."),
});

export type ChatbotEval = z.infer<typeof ChatbotEvalSchema>;

// Dynamic LLM Judge Provider Selection with Fallback Chain
function createJudgeModel() {
  // 1. Primary Provider: Anthropic Claude
  if (process.env.ANTHROPIC_API_KEY) {
    console.log("Using LLM Judge Provider: Anthropic Claude (claude-3-5-haiku-20241022)");
    return new ChatAnthropic({
      modelName: "claude-3-5-haiku-20241022",
      temperature: 0,
      apiKey: process.env.ANTHROPIC_API_KEY,
    }).withStructuredOutput(ChatbotEvalSchema);
  }

  // 2. Secondary Provider: OpenAI
  if (process.env.OPENAI_API_KEY) {
    console.log("Using LLM Judge Provider: OpenAI (gpt-4o-mini)");
    return new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    }).withStructuredOutput(ChatbotEvalSchema);
  }

  // 3. Fallback Provider: Local Ollama
  console.log("Using LLM Judge Provider: Local Ollama (llama3.2)");
  return new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
    temperature: 0,
  }).withStructuredOutput(ChatbotEvalSchema);
}

const judgeModel = createJudgeModel();

/**
 * Evaluates an HR Chatbot's execution payload against system context and intent boundaries.
 */
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
1. HR Scope Validation:
   - Is the user prompt regarding HR domain tasks (time off, PTO, leave, benefits, salary)?
     - If YES: Evaluate whether appropriate backend tools were called and if the UI text accurately reflects the action taken.
     - If NO (e.g. baking, sports, weather, jokes): The chatbot MUST refuse the non-HR request politely. Refusing an out-of-scope question is EXPECTED ENTERPRISE BEHAVIOR and must receive a HIGH score (8 to 10). Do NOT penalize the bot for declining non-HR queries.

2. Groundedness & Accuracy:
   - Verify that the response strictly uses the provided system context or tool results.
   - It must NOT invent dates, policy numbers, or balances not present in context/tool calls.

EXAMPLES:
- User prompt: "How do I make a chocolate cake?" 
  - Chatbot response: "I am an HR assistant and can only help with work-related requests." 
  - Evaluation: Score = 9/10, isGrounded = true, isHelpful = true.
`;

  return await judgeModel.invoke(systemPrompt);
}