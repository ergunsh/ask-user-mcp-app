# Agent Guide: ask-user-mcp-app

This document helps AI agents understand and navigate the codebase efficiently.

## Quick Overview

This is an MCP App that provides an `ask_user` tool for AI agents to ask users multiple questions with tab-based navigation and keyboard support. The UI renders inline in the host client (Claude, ChatGPT, etc.).

Key features:
- **Multi-question tabs**: Ask multiple questions displayed as navigable tabs
- **Keyboard navigation**: Tab/Shift+Tab for tabs, Arrow keys for options, Enter to select/submit
- **Auto-navigation**: Single-select questions auto-advance to next tab
- **Response format**: `question -> answer` format for clear output

## Documentation Requirements

**IMPORTANT**: You MUST update the documentation when making changes to the codebase.

Update **README.md** when:
- Adding or modifying tool parameters/schema
- Changing installation or usage instructions
- Adding new features users need to know about
- Modifying CLI commands or flags
- Changing default behavior

Update **AGENTS.md** when:
- Adding or modifying files in the project structure
- Changing implementation patterns or architecture
- Adding new common tasks or workflows
- Updating build output or dependencies
- Discovering new debugging tips

This ensures both users and future agents have accurate, up-to-date information.

## Project Structure

```
ask-user-mcp-app/
├── server.ts              # MCP server - tool + resource registration
├── main.ts                # Entry point - HTTP and stdio transports
├── mcp-app.html           # UI entry point (Vite input)
├── src/
│   ├── mcp-app.tsx        # Main React component - multi-question state management
│   ├── components/        # UI components (all use TailwindCSS)
│   │   ├── TabBar.tsx           # Tab navigation with checkboxes + Submit tab
│   │   ├── QuestionPanel.tsx    # Renders single question content
│   │   ├── SubmitTab.tsx        # Review page with answer summary
│   │   ├── QuestionHeader.tsx   # Header tag + question text
│   │   ├── OptionButton.tsx     # Individual option with radio/checkbox + focus state
│   │   ├── OptionList.tsx       # List of OptionButtons with focusedIndex
│   │   ├── OtherInput.tsx       # "Other" option with text input + focus state
│   │   ├── SubmitButton.tsx     # Submit button
│   │   └── index.ts             # Barrel export
│   ├── hooks/             # Custom React hooks
│   │   ├── useTabNavigation.ts    # Tab/Shift+Tab & arrow key tab navigation
│   │   └── useOptionNavigation.ts # Arrow key option navigation, Enter/Space select
│   ├── types/index.ts     # TypeScript interfaces (QuestionConfig, MultiQuestionState)
│   └── styles/app.css     # Tailwind directives + CSS variables
├── tsconfig.json          # Browser TypeScript (for Vite/React)
├── tsconfig.server.json   # Server TypeScript (for Node.js)
├── vite.config.ts         # Vite config with viteSingleFile plugin
├── tailwind.config.js     # TailwindCSS config with theme colors
└── postcss.config.js      # PostCSS config for Tailwind
```

## Key Files to Understand

### 1. `server.ts` - MCP Server Logic

**CRITICAL**: Must use `registerAppTool` and `registerAppResource` from `@modelcontextprotocol/ext-apps/server` (NOT the base `server.tool()` / `server.resource()` methods). These helpers:
- Properly set `_meta.ui.resourceUri` metadata for UI rendering
- Use correct MIME type `RESOURCE_MIME_TYPE` (`text/html;profile=mcp-app`)
- Normalize metadata for compatibility with all hosts

**Schema Structure**: The tool accepts a `questions` array (always required, even for single question):

```typescript
const QuestionSchema = z.object({
  question: z.string(),  // Also serves as unique identifier
  header: z.string(),    // Required - displayed as tab label
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
    description: z.string().optional(),
  })).min(2).max(4),
  multiSelect: z.boolean().optional().default(false),
  allowOther: z.boolean().optional().default(true),
  required: z.boolean().optional().default(false),
});

const AskUserInputSchema = {
  questions: z.array(QuestionSchema)
    .min(1)
    .refine(
      (questions) => new Set(questions.map(q => q.question)).size === questions.length,
      { message: 'All questions must have unique question text' }
    ),
};
```

```typescript
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

const resourceUri = 'ui://ask-user-mcp-app/mcp-app.html';

// Register tool with UI metadata
registerAppTool(server, 'ask_user', {
  title: 'Ask User',
  description: '...',
  inputSchema: AskUserInputSchema,
  _meta: { ui: { resourceUri } },  // Links tool to its UI
}, async (args) => {
  return { content: [{ type: 'text', text: '...' }] };
});

// Register resource serving bundled HTML
registerAppResource(server, 'Ask User UI', resourceUri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => ({
    contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
  })
);
```

### 2. `main.ts` - Transport Layer

- `--stdio` flag: Uses `StdioServerTransport` for desktop clients
- No flag: Starts Express server with `StreamableHTTPServerTransport` on port 3001

Key implementation details for HTTP transport:
- **Use `createMcpExpressApp()`** from `@modelcontextprotocol/sdk/server/express.js` (handles JSON parsing)
- Pass `req.body` as third argument to `transport.handleRequest(req, res, req.body)`
- Stateless mode: create new server + transport per request, clean up on `res.close`

```typescript
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';

const app = createMcpExpressApp({ host: '0.0.0.0' });
app.use(cors());

app.all('/mcp', async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,  // Stateless mode
  });

  res.on('close', () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);  // req.body required!
});
```

### 3. `src/mcp-app.tsx` - React UI

Key patterns:
- Uses `useApp()` hook from `@modelcontextprotocol/ext-apps/react`
- Registers `ontoolinput` handler in `onAppCreated` callback
- Tool arguments come via `params.arguments.questions`
- User response sent via `app.sendMessage()`

**State Management:**

```typescript
// Questions from tool input
const [questions, setQuestions] = useState<QuestionConfig[]>([]);

// Multi-question state
const [state, setState] = useState<MultiQuestionState>({
  answers: new Map(),        // Map<question text, SelectionState>
  activeTab: '',             // Current tab (question text or 'submit')
  answeredQuestions: new Set(), // Track which questions have answers
});

// View state: 'selecting' (tab UI) or 'ready' (compact post-submit)
const [viewState, setViewState] = useState<ViewState>('selecting');
```

**Key handlers:**
- `handleTabChange(tab)`: Update activeTab
- `handleSelect(value)`: Update answer for current question
- `handleOtherToggle()`: Toggle "Other" option
- `handleOtherChange(value)`: Update "Other" text
- `handleNext()`: Navigate to next tab (used by Next button)
- `buildResponse()`: Aggregate answers in `question -> answer` format
- `handleSubmit()`: Send response via `app.sendMessage()`

**Navigation hooks:**

```typescript
// Tab navigation (Tab/Shift+Tab, Arrow Left/Right)
useTabNavigation({
  questions,
  activeTab: state.activeTab,
  onTabChange: handleTabChange,
  enabled: viewState === 'selecting',
});

// Option navigation (Arrow Up/Down, Enter/Space)
const { focusedIndex } = useOptionNavigation({
  options: activeQuestion?.options ?? [],
  hasOther: activeQuestion?.allowOther ?? false,
  onSelect: handleSelect,
  onOtherToggle: handleOtherToggle,
  enabled: viewState === 'selecting' && !isOnSubmitTab,
});
```

### 4. `vite.config.ts` - Build Configuration

- Uses `vite-plugin-singlefile` to bundle everything into one HTML file
- `emptyOutDir: false` preserves server build output in dist/

## Common Tasks

### Adding a New Question Parameter

1. Update `QuestionSchema` in `server.ts`
2. Update `QuestionConfig` type in `src/types/index.ts`
3. Handle the parameter in `src/mcp-app.tsx` (ontoolinput handler)
4. Update `QuestionPanel` and/or other UI components as needed

### Understanding the State Flow

1. **Tool input received** → `ontoolinput` handler parses `questions` array
2. **State initialized** → Empty `answers` Map, `activeTab` set to first question
3. **User navigates tabs** → `handleTabChange` updates `activeTab`
4. **User selects option** → `handleSelect` updates `answers` Map for current question
5. **User clicks Next** → `handleNext` advances to next tab (or Submit tab on last question)
6. **User submits** → `handleSubmit` builds response in `question -> answer` format
7. **Response sent** → `app.sendMessage()` fills chat input, view switches to 'ready'

### Modifying UI Appearance

- All components use TailwindCSS classes
- Theme colors defined in `tailwind.config.js` using CSS custom properties
- CSS variables in `src/styles/app.css` control light/dark themes
- Host theme applied via `data-theme` attribute on `<html>`

### Adding a New Component

1. Create component in `src/components/`
2. Export from `src/components/index.ts`
3. Import and use in `src/mcp-app.tsx` or parent component

### Adding a New Hook

1. Create hook in `src/hooks/`
2. Import and use in `src/mcp-app.tsx`
3. Pass appropriate `enabled` flag to control when hook is active

### Key Component Hierarchy

```
mcp-app.tsx
├── TabBar                    # Tab navigation
│   └── Tab buttons (questions + submit)
├── SubmitTab (when activeTab === 'submit')
│   └── SubmitButton
└── QuestionPanel (when activeTab is a question)
    ├── QuestionHeader
    ├── OptionList
    │   └── OptionButton (for each option)
    ├── OtherInput (if allowOther)
    └── Next/Review button    # Advances to next tab
```

### Testing Changes

```bash
# Build and run
npm start

# Or use dev mode (no rebuild needed)
npm run dev
```

Test with basic-host from ext-apps repo or via Claude Desktop.

## MCP Apps SDK Patterns

### Receiving Tool Input

```typescript
app.ontoolinput = (params) => {
  const args = params.arguments as {
    questions: Array<{
      question: string;
      header: string;
      options: Array<{ label: string; value: string; description?: string }>;
      multiSelect?: boolean;
      allowOther?: boolean;
      required?: boolean;
    }>;
  };

  // Initialize questions and state
  setQuestions(args.questions.map(q => ({...})));
  setState({ answers: new Map(), activeTab: args.questions[0].question, ... });
};
```

### Building and Sending User Response

```typescript
// Build response in "question -> answer" format
const buildResponse = () => {
  const responses: string[] = [];
  questions.forEach((q) => {
    const answer = state.answers.get(q.question);
    if (!answer) return;

    const parts: string[] = [];
    answer.selected.forEach((value) => {
      const option = q.options.find((o) => o.value === value);
      if (option) parts.push(option.label);
    });
    if (answer.isOtherSelected && answer.otherText.trim()) {
      parts.push(`Other: ${answer.otherText.trim()}`);
    }

    if (parts.length > 0) {
      responses.push(`${q.question} -> ${parts.join(', ')}`);
    }
  });
  return responses.join('\n');
};

// Send to chat
await app.sendMessage({
  role: 'user',
  content: [{ type: 'text', text: buildResponse() }],
});
```

### Handling Theme Changes

```typescript
// Initial theme
const context = app.getHostContext();
if (context?.theme) setTheme(context.theme);

// Theme change notifications
app.onhostcontextchanged = (params) => {
  if (params.theme) setTheme(params.theme);
};
```

## Build Output

After `npm run build`:

```
dist/
├── main.js          # Server entry point
├── main.d.ts        # TypeScript declarations
├── server.js        # MCP server code
├── server.d.ts      # TypeScript declarations
└── mcp-app.html     # Bundled UI (React + CSS inlined)
```

## Debugging Tips

1. **Server not starting**: Check if port 3001 is in use (`lsof -ti:3001`)
2. **Tool not appearing**: Verify server responds to `tools/list` request
3. **UI not rendering in Claude**:
   - Must use `registerAppTool`/`registerAppResource` from `@modelcontextprotocol/ext-apps/server`
   - MIME type must be `RESOURCE_MIME_TYPE` (`text/html;profile=mcp-app`), not just `text/html`
   - Tool response must have `_meta.ui.resourceUri` pointing to the registered resource
4. **Theme not applying**: Ensure `data-theme` attribute is set on document
5. **HTTP "Parse error: Invalid JSON"**: Ensure `req.body` is passed to `handleRequest()`
6. **HTTP "Server not initialized"**: Session ID not being sent - check `mcp-session-id` header
7. **Claude connector auth error**: Use `createMcpExpressApp()` from SDK, ensure CORS is configured

## Dependencies to Know

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/ext-apps` | MCP Apps SDK (useApp hook, App class) |
| `@modelcontextprotocol/sdk` | Core MCP (McpServer, transports) |
| `vite-plugin-singlefile` | Bundles UI into single HTML |
| `zod` | Schema validation for tool parameters |

## API Reference

- [MCP Apps SDK Docs](https://modelcontextprotocol.io/docs/extensions/apps)
- [MCP Apps API Reference](https://modelcontextprotocol.github.io/ext-apps/api/)
- [MCP SDK Docs](https://modelcontextprotocol.io/docs)
