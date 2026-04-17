#!/usr/bin/env node

import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import cors from 'cors';
import type { Express, Request, Response } from 'express';
import { landingHtml } from './landing.js';
import { createServer } from './server.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

/**
 * Creates the Express app with MCP endpoints (without starting the server).
 */
function createExpressApp(createServerFn: () => McpServer): Express {
  const app = createMcpExpressApp({ host: '0.0.0.0' });
  app.use(cors());

  app.all('/mcp', async (req: Request, res: Response) => {
    const server = createServerFn();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Landing page
  app.get('/', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(landingHtml);
  });

  return app;
}

/**
 * Starts an MCP server with Streamable HTTP transport in stateless mode.
 */
async function startStreamableHTTPServer(
  createServerFn: () => McpServer,
): Promise<void> {
  const app = createExpressApp(createServerFn);

  const httpServer = app.listen(PORT, () => {
    console.log(`MCP server listening on http://localhost:${PORT}/mcp`);
  });

  const shutdown = () => {
    console.log('\nShutting down...');
    httpServer.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * Starts an MCP server with stdio transport.
 */
async function startStdioServer(
  createServerFn: () => McpServer,
): Promise<void> {
  await createServerFn().connect(new StdioServerTransport());
}

// Export Express app for Vercel serverless
export const app = createExpressApp(createServer);
export default app;

async function main() {
  if (process.argv.includes('--stdio')) {
    await startStdioServer(createServer);
  } else {
    await startStreamableHTTPServer(createServer);
  }
}

// Only start server if running directly (not imported by Vercel)
const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
