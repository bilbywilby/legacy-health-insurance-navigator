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
    if (onChunk) {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        max_completion_tokens: 16000,
        stream: true,
      });
      return this.handleStreamResponse(stream, message, conversationHistory, documents, insuranceState, onChunk);
    }
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
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
    conversationHistory: Message[],
    documents: InsuranceDocument[],
    insuranceState: InsuranceState | undefined,
    onChunk: (chunk: string) => void
  ) {
    let fullContent = '';
    const accumulatedToolCalls: ChatCompletionMessageFunctionToolCall[] = [];
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onChunk(delta.content);
        }
        if (delta?.tool_calls) {
          for (let i = 0; i < delta.tool_calls.length; i++) {
            const deltaToolCall = delta.tool_calls[i];
            if (!accumulatedToolCalls[i]) {
              accumulatedToolCalls[i] = {
                id: deltaToolCall.id || `tool_${Date.now()}_${i}`,
                type: 'function',
                function: {
                  name: deltaToolCall.function?.name || '',
                  arguments: deltaToolCall.function?.arguments || ''
                }
              };
            } else {
              if (deltaToolCall.function?.name && !accumulatedToolCalls[i].function.name) {
                accumulatedToolCalls[i].function.name = deltaToolCall.function.name;
              }
              if (deltaToolCall.function?.arguments) {
                accumulatedToolCalls[i].function.arguments += deltaToolCall.function.arguments;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      throw new Error('Stream processing failed');
    }
    if (accumulatedToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponse = await this.generateToolResponse(message, conversationHistory, documents, insuranceState, accumulatedToolCalls, executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent };
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
    if (!responseMessage.tool_calls) return { content: responseMessage.content || 'I apologize, but I encountered an issue.' };
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
        { role: 'system', content: 'You are the Legacy Health Navigator. Respond naturally and strategically to the data discovered.' },
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
    const docContext = documents.length > 0
      ? `## REFERENCE CONTEXT (Data Primacy Documents)\n${documents.map(d => `[DOCUMENT: ${d.title} (${d.type})]\n${d.content}\n---`).join('\n')}`
      : 'No specific policy documents have been uploaded yet. Encourage EOC/SBC upload.';
    const stateContext = insuranceState 
      ? `## YTD FINANCIAL STATUS\n- Deductible: ${insuranceState.deductibleUsed}/${insuranceState.deductibleTotal}\n- OOP Max: ${insuranceState.oopUsed}/${insuranceState.oopMax}`
      : 'YTD tracking not initialized.';
    const systemPrompt = `
      # MASTER PERSONA: Senior Health Insurance Auditor (Legacy Navigator)
      You are an elite AI agent specialized in Forensic Analysis of medical billing and insurance contracts.
      ## CORE OPERATING PRINCIPLES
      - **Data Primacy**: Always prioritize uploaded policy documents (EOC/SBC) over general knowledge.
      - **Financial Precision**: Calculate responsibility using JetBrains Mono formatting for codes and figures.
      - **State-Awareness**: Use the YTD Status to suggest accelerating or deferring care.
      ${stateContext}
      ${docContext}
      ## STRATEGIC DIRECTIVES (LEGACY MODE)
      1. **Code Alignment**: Provide CPT/HCPCS codes for any procedure. Explain how "Coding Intensity" affects bills.
      2. **Pre-Service Protocol**: For care >$500, suggest a "Verification of Benefits" checklist.
      3. **Financial Arbitrage**: Advise on HSA/FSA spend-down vs. deductible reset dates in Q4.
      4. **Dispute Escalation**: Provide instructions for Independent Medical Reviews (IMR) if appeals fail.
      ## MODULE: PROACTIVE CARE & COST NAVIGATOR
      - **Appointment Validation**: Identify Network Status (Tier 1 vs Tier 2). Ask for NPI/Tax ID.
      - **Long-Term Impact**: Calculate how a cost hits the OOP Max. Explain "Incentive to Bundle" if near limits.
      - **Plan Maximization (ROI)**: Hunt for "Value-Added" benefits like $0 Wellness Exams, screenings, or gym reimbursements.
      ## REGULATORY FRAMEWORK
      - **No Surprises Act**: Flag balance billing in emergency settings.
      - **ERISA**: Apply federal standards for employer-sponsored plans.
      ## INTERACTION STYLE
      - Format technical data in JetBrains Mono.
      - End every response with a "Next Strategic Step".
      - Disclaimer: "Legacy Navigator provides financial advocacy, not legal or clinical advice."
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