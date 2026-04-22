# Agent Guide: ask-user-mcp-app

This document helps AI agents understand and navigate the codebase efficiently.

## Quick Overview

This is an MCP App that provides an `ask_user` tool for AI agents to ask users multiple questions with tab-based navigation and keyboard support. The UI renders inline in the host client (Claude, ChatGPT, etc.).

Key features:
- **Multi-question tabs**: Ask multiple questions displayed as navigable tabs
- **Keyboard navigation**: Tab/Shift+Tab for tabs, Arrow keys for options, Enter to select/submit
- **"Other" input handling**: When user clicks "Other", textbox auto-focuses; Arrow keys work for editing; Tab/Escape blur the input
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
├── landing.ts             # Self-contained HTML for GET / landing page
├── api/
│   └── index.ts           # Vercel serverless entry (wires /, /mcp, /health)
├── mcp-app.html           # UI entry point (Vite input)
├── src/
│   ├── mcp-app.tsx        # Main React component - multi-question state management
│   ├── components/        # UI components (all use TailwindCSS)
│   │   ├── TabBar.tsx           # Pill-style tab navigation with progress indicator
│   │   ├── QuestionPanel.tsx    # Renders single question with refined card styling
│   │   ├── SubmitTab.tsx        # Review page with staggered animations
│   │   ├── QuestionHeader.tsx   # Question text with optional subtitle
│   │   ├── OptionButton.tsx     # Elegant option cards with hover/selection states
│   │   ├── OptionList.tsx       # List of OptionButtons with focusedIndex
│   │   ├── OtherInput.tsx       # "Other" option with text input; imperatively focuses on toggle, blurs on Tab/Escape
│   │   ├── SubmitButton.tsx     # Primary action button with accent color
│   │   └── index.ts             # Barrel export
│   ├── hooks/             # Custom React hooks
│   │   ├── useTabNavigation.ts    # Tab/Shift+Tab & arrow key tab navigation; Tab works even when focused on input
│   │   ├── useOptionNavigation.ts # Arrow key option navigation, Enter/Space select
│   │   └── useWindowFocus.ts      # Tracks window focus state for conditional focus outlines
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

### 3. `landing.ts` & `api/index.ts` - Public Landing Page

`GET /` serves a self-contained HTML documentation page built from `landing.ts` (exports a `landingHtml` string with inline CSS and `prefers-color-scheme` dark variant — no external assets). Both the Vercel handler (`api/index.ts`) and the local-dev Express app (`main.ts`) register the route:

```typescript
app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(landingHtml);
});
```

The Vercel rewrite `/(.*) → /api` (see `vercel.json`) forwards every path to this Express app, so `/` hits the landing route, `/mcp` and `/health` hit their own routes, and anything else falls through to Express's default 404.

**When updating the landing page:** keep it self-contained — no Tailwind, no external scripts, no fonts beyond system stack. It must serve from a single file with no build step.

`landing.ts` lives at the project root (not `src/`) because `tsconfig.server.json` excludes `src/`. If moving it, update `include` in `tsconfig.server.json`.

### 4. `src/mcp-app.tsx` - React UI

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
// NOTE: Tab key works even when user is focused on the "Other" text input
useTabNavigation({
  questions,
  activeTab: state.activeTab,
  onTabChange: handleTabChange,
  enabled: viewState === 'selecting',
});

// Option navigation (Arrow Up/Down, Enter/Space)
// NOTE: Arrow keys are disabled when user is focused on the "Other" text input (allows normal text editing)
const { focusedIndex } = useOptionNavigation({
  options: activeQuestion?.options ?? [],
  hasOther: activeQuestion?.allowOther ?? false,
  onSelect: handleSelect,
  onOtherToggle: handleOtherToggle,
  enabled: viewState === 'selecting' && !isOnSubmitTab,
});

// Window focus tracking - focus outlines only show when window is focused
const isWindowFocused = useWindowFocus();
const effectiveFocusedIndex = isWindowFocused ? focusedIndex : undefined;
```

### 5. `vite.config.ts` - Build Configuration

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

**Design System Colors (Claude-native palette):**

| Variable | Light | Dark | Purpose |
|----------|-------|------|---------|
| `--mcp-surface` | `#ffffff` | `#1c1a17` | Base background |
| `--mcp-surface-elevated` | `#faf8f5` | `#252320` | Elevated surfaces |
| `--mcp-surface-warm` | `#f5f1eb` | `#2a2724` | Hover backgrounds |
| `--mcp-accent` | `#c4704b` | `#d4896b` | Primary accent (terra cotta) |
| `--mcp-text-primary` | `#1a1815` | `#f5f2ed` | Main text |
| `--mcp-text-secondary` | `#6b635a` | `#a8a099` | Secondary text |
| `--mcp-text-muted` | `#9c948a` | `#6b655e` | Muted text |
| `--mcp-border` | `#e8e4de` | `#3a3632` | Default borders |
| `--mcp-selected-bg` | `#faf6f2` | `#2e2925` | Selected state background |
| `--mcp-success` | `#5a8a5a` | `#7aaa7a` | Success indicators |

**Tailwind Utility Classes:**
- Surfaces: `bg-surface`, `bg-surface-elevated`, `bg-surface-warm`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Accent: `bg-accent`, `text-accent`, `hover:bg-accent-hover`
- Borders: `border-border`, `border-border-subtle`, `border-selected-border`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-focus`
- Animation: `animate-fade-in` with delay utilities (`animate-delay-1` to `animate-delay-4`)

### Adding a New Component

1. Create component in `src/components/`
2. Export from `src/components/index.ts`
3. Import and use in `src/mcp-app.tsx` or parent component

### Adding a New Hook

1. Create hook in `src/hooks/`
2. Import and use in `src/mcp-app.tsx`
3. Pass appropriate `enabled` flag to control when hook is active

### Understanding "Other" Input Keyboard Behavior

The `OtherInput` component uses an imperative ref callback to focus the textbox only when the user **first clicks** the "Other" button (not on tab navigation back):

- **Focus**: User clicks "Other" → textbox auto-focuses imperatively via ref callback
- **Arrow keys**: Work normally inside textbox for text editing (cursor movement, selection)
- **Tab key**: Blurs the input and navigates to the next tab (handled by `useTabNavigation`)
- **Escape key**: Blurs the input without navigating (handled by `OtherInput`'s `onKeyDown`)

This prevents focus on tab navigation back while allowing direct text editing experience.

To modify this behavior:
- Change focus trigger: Edit the ref callback condition in `OtherInput.tsx`
- Change Tab behavior: Update the `Tab` handler in `useTabNavigation.ts` (currently allows Tab in inputs)
- Add keyboard shortcuts: Extend `OtherInput`'s `onKeyDown` handler

### Key Component Hierarchy

```
mcp-app.tsx
├── TabBar                    # Pill tabs with progress bar
│   ├── Progress indicator (animated bar + count)
│   └── Pill buttons (questions + submit)
├── SubmitTab (when activeTab === 'submit')
│   ├── Review header
│   ├── Answer cards (with staggered animations)
│   └── SubmitButton (accent-colored CTA)
└── QuestionPanel (when activeTab is a question)
    ├── QuestionHeader (question + optional subtitle)
    ├── OptionList
    │   └── OptionButton (elegant cards with selection state)
    ├── OtherInput (if allowOther)
    └── Continue button       # Advances to next tab
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
