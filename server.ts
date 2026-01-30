import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

// Works both from source (server.ts) and compiled (dist/server.js)
const DIST_DIR = import.meta.filename.endsWith('.ts')
  ? path.join(import.meta.dirname, 'dist')
  : import.meta.dirname;

// Schema for a single question
const QuestionSchema = z.object({
  question: z.string().describe('The question to ask the user (also serves as unique identifier)'),
  header: z.string().describe('Short label displayed as a tab (max 12 chars), e.g., "Framework"'),
  options: z.array(z.object({
    label: z.string().describe('Display text for this option'),
    value: z.string().describe('Value returned when this option is selected'),
    description: z.string().optional().describe('Additional context for this option'),
  })).min(2).max(4).describe('Available choices (2-4 options)'),
  multiSelect: z.boolean().optional().default(false).describe('Allow multiple selections'),
  allowOther: z.boolean().optional().default(true).describe('Include "Other" text input option'),
  required: z.boolean().optional().default(false).describe('Whether this question must be answered'),
});

// Schema for the ask_user tool input - always requires questions array
const AskUserInputSchema = {
  questions: z.array(QuestionSchema)
    .min(1)
    .describe('Array of questions to ask the user, displayed as tabs')
    .refine(
      (questions) => {
        const questionTexts = questions.map(q => q.question);
        return new Set(questionTexts).size === questionTexts.length;
      },
      { message: 'All questions must have unique question text' }
    ),
};

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'ask-user-mcp-app',
    version: '1.0.0',
  });

  // Resource URI that links the tool to its UI
  const resourceUri = 'ui://ask-user-mcp-app/mcp-app.html';

  // Register the ask_user tool with UI metadata
  registerAppTool(
    server,
    'ask_user',
    {
      title: 'Ask User',
      description: 'Ask the user a question with multiple-choice options. Renders an interactive UI inline in the conversation.',
      inputSchema: AskUserInputSchema,
      _meta: { ui: { resourceUri } },
    },
    async (args): Promise<CallToolResult> => {
      const questions = args.questions as Array<{ question: string; header: string }>;
      const questionHeaders = questions.map(q => q.header).join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `Asking user ${questions.length} question(s): ${questionHeaders}`,
          },
        ],
      };
    },
  );

  // Register the UI resource that serves the bundled HTML
  registerAppResource(
    server,
    'Ask User UI',
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(DIST_DIR, 'mcp-app.html'), 'utf-8');
      return {
        contents: [
          {
            uri: resourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      };
    },
  );

  return server;
}
