import { ChatOllama } from "@langchain/ollama";
import { z } from "zod";

export const ChatbotEvalSchema = z.object({
  score: z.number().min(0).max(10).describe("An INTEGER score from 0 to 10 evaluating response appropriateness."),
  isGrounded: z.boolean().describe("True if response relies strictly on context/tools and doesn't invent facts."),
  isHelpful: z.boolean().describe("True if response addresses user prompt appropriately given HR boundaries."),
  reasoning: z.string().describe("Detailed explanation justifying the score."),
});

export type ChatbotEval = z.infer<typeof ChatbotEvalSchema>;

const judgeModel = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "llama3.2",
  temperature: 0,
}).withStructuredOutput(ChatbotEvalSchema);

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