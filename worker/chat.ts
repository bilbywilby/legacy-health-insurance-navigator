import OpenAI from 'openai';
import type { Message, ToolCall, InsuranceDocument, InsuranceState } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  constructor(aiGatewayUrl: string, apiKey: string, model: string) {
    this.client = new OpenAI({
      baseURL: aiGatewayUrl,
      apiKey: apiKey
    });
    this.model = model;
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    documents: InsuranceDocument[] = [],
    insuranceState?: InsuranceState,
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const messages = this.buildConversationMessages(message, conversationHistory, documents, insuranceState);
    const toolDefinitions = await getToolDefinitions();
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_tokens: 16000,
      stream: false
    });
    return this.handleNonStreamResponse(completion, message, conversationHistory, documents, insuranceState);
  }
  private async handleNonStreamResponse(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    message: string,
    conversationHistory: Message[],
    documents: InsuranceDocument[],
    insuranceState: InsuranceState | undefined
  ) {
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) return { content: 'I apologize, but I encountered an issue.' };
    if (!responseMessage.tool_calls) {
        return { content: responseMessage.content || 'I apologize, but I encountered an issue.' };
    }
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
    const finalResponse = await this.generateToolResponse(message, conversationHistory, documents, insuranceState, responseMessage.tool_calls, toolCalls);
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          const result = await executeTool(tc.function.name, args);
          return { id: tc.id, name: tc.function.name, arguments: args, result };
        } catch (error) {
          return { id: tc.id, name: tc.function.name, arguments: {}, result: { error: String(error) } };
        }
      })
    );
  }
  private async generateToolResponse(
    userMessage: string,
    history: Message[],
    documents: InsuranceDocument[],
    insuranceState: InsuranceState | undefined,
    openAiToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
    toolResults: ToolCall[]
  ): Promise<string> {
    const followUpCompletion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are the Legacy Health Navigator. Respond with forensic precision and structured financial data.' },
        ...history.slice(-3).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
        { role: 'assistant', content: null, tool_calls: openAiToolCalls },
        ...toolResults.map((result, index) => ({
          role: 'tool' as const,
          content: JSON.stringify(result.result),
          tool_call_id: openAiToolCalls[index]?.id || result.id
        }))
      ],
      max_tokens: 16000
    });
    return followUpCompletion.choices[0]?.message?.content || 'Strategic step compiled.';
  }
  private buildConversationMessages(userMessage: string, history: Message[], documents: InsuranceDocument[], insuranceState?: InsuranceState) {
    const stateContext = insuranceState
      ? `## YTD FINANCIAL STATUS\n- Plan: ${insuranceState.planType || 'PPO'}\n- Network: ${insuranceState.networkStatus || 'In-Network'}\n- Deductible: ${insuranceState.deductibleUsed}/${insuranceState.deductibleTotal}\n- OOP Max: ${insuranceState.oopUsed}/${insuranceState.oopMax}`
      : 'YTD tracking not initialized.';
    const systemPrompt = `
      # MASTER PERSONA: Senior Health Insurance Auditor (V2 Forensic Core)
      You are an elite AI agent specialized in Forensic Analysis of medical billing.
      ## CORE OPERATING PRINCIPLES
      - **Forensic JSON Schema**: For every financial calculation, include a hidden block:
        <forensic_data>
        {
          "liability_calc": number,
          "confidence_score": 0.0-1.0,
          "code_validation": boolean,
          "strategic_disclaimer": "string"
        }
        </forensic_data>
      - **Validation Logic**: Use insurance state math to verify patient responsibility. 
      - **JetBrains Mono**: Format all CPT codes and costs in \`monospace\`.
      ${stateContext}
      ## STRATEGIC DIRECTIVES
      1. **PII Warning**: Confirm you are operating on de-identified data (PII Scrub Active).
      2. **Liability Audit**: If a claim exceeds the remaining OOP Max, flag it immediately.
      3. **Shop Care Logic**: If asked about future costs, calculate the "Net Patient Responsibility" based on remaining deductible.
      ## REGULATORY FRAMEWORK
      - **No Surprises Act**: Mandatory flag for potential balance billing.
      - **ERISA Compliance**: Audit against federal standards.
      End every response with a "Next Strategic Step".
      Disclaimer: "Legacy Navigator provides financial advocacy, not legal or clinical advice."
    `.trim();
    return [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage }
    ];
  }
  updateModel(newModel: string): void {
    this.model = newModel;
  }
}