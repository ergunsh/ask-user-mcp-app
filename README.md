# Ask User MCP App

An MCP App that enables AI agents to ask users multiple questions with tab-based navigation, multiple-choice options, multi-select support, and custom text input - all rendered inline in the conversation.

## Features

- **Multi-Question Tabs**: Ask multiple questions at once, displayed as navigable tabs
- **Keyboard Navigation**: Tab/Shift+Tab to navigate tabs, Arrow keys for options, Enter to select/submit
- **Auto-Navigation**: Single-select questions automatically advance to the next tab
- **Multiple Choice Questions**: Present 2-4 options per question
- **Single & Multi-Select**: Support both radio-button style (single) and checkbox style (multi) selection
- **Custom "Other" Input**: Optional text input for answers not covered by predefined options
- **Skip Questions**: Non-required questions can be skipped
- **Theme Support**: Automatically adapts to host's light/dark theme
- **Dual Transport**: Works with both HTTP (web clients) and stdio (desktop clients)

## Installation

```bash
npm install ask-user-mcp-app
```

Or clone and build locally:

```bash
git clone https://github.com/anthropics/ask-user-mcp-app
cd ask-user-mcp-app
npm install
npm run build
```

## Usage

### Local Development (stdio)

Build and run locally with Claude Desktop:

```bash
# Clone and build
git clone https://github.com/anthropics/ask-user-mcp-app
cd ask-user-mcp-app
npm install
npm run build
```

Add to your `claude_desktop_config.json` (use the absolute path to your clone):

```json
{
  "mcpServers": {
    "ask-user": {
      "command": "node",
      "args": ["/absolute/path/to/ask-user-mcp-app/dist/main.js", "--stdio"]
    }
  }
}
```

### Claude Desktop (via npx)

If published to npm, add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ask-user": {
      "command": "npx",
      "args": ["ask-user-mcp-app", "--stdio"]
    }
  }
}
```

### Web Clients (Claude.ai, ChatGPT, etc.)

Start the HTTP server:

```bash
npm start
```

The server runs at `http://localhost:3001/mcp`. For remote access, use a tunnel:

```bash
npx cloudflared tunnel --url http://localhost:3001
```

Add the tunnel URL as a custom connector in your client's settings.

## Tool Schema

The `ask_user` tool accepts a `questions` array containing one or more questions to display as tabs:

### Top-Level Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `questions` | array | Yes | Array of question objects (minimum 1) |

### Question Object Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `question` | string | Yes | The question to ask (also used as unique identifier) |
| `header` | string | Yes | Short label displayed as tab name (max 12 chars) |
| `options` | array | Yes | 2-4 choices, each with `label`, `value`, and optional `description` |
| `multiSelect` | boolean | No | Allow multiple selections (default: false) |
| `allowOther` | boolean | No | Include "Other" text input option (default: true) |
| `required` | boolean | No | Whether this question must be answered (default: false) |

### Example Tool Call

```json
{
  "name": "ask_user",
  "arguments": {
    "questions": [
      {
        "question": "Which frontend framework would you like to use for this project?",
        "header": "Framework",
        "options": [
          { "label": "React", "value": "react", "description": "Popular library with component-based architecture" },
          { "label": "Vue", "value": "vue", "description": "Progressive framework for simplicity" },
          { "label": "Svelte", "value": "svelte", "description": "Compiler-based, highly optimized" }
        ],
        "required": true
      },
      {
        "question": "How should we handle authentication?",
        "header": "Auth Method",
        "options": [
          { "label": "OAuth 2.0", "value": "oauth", "description": "Industry standard, supports SSO" },
          { "label": "JWT", "value": "jwt", "description": "Stateless, good for APIs" },
          { "label": "Session-based", "value": "session", "description": "Traditional, server-side state" }
        ]
      },
      {
        "question": "Which testing frameworks should we include?",
        "header": "Testing",
        "options": [
          { "label": "Jest", "value": "jest", "description": "Popular testing framework" },
          { "label": "Vitest", "value": "vitest", "description": "Fast, Vite-native testing" },
          { "label": "Playwright", "value": "playwright", "description": "E2E testing" }
        ],
        "multiSelect": true
      }
    ]
  }
}
```

### Response Format

When the user submits their answers, the response is formatted as:

```
Which frontend framework would you like to use for this project? -> React
How should we handle authentication? -> JWT
Which testing frameworks should we include? -> Vitest, Playwright
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab / Shift+Tab | Navigate between question tabs |
| Arrow Left / Right | Navigate between question tabs |
| Arrow Up / Down | Navigate between options in current question |
| Enter / Space | Select current option |
| Enter (on Submit tab) | Submit all answers |

## Development

### Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build server and UI |
| `npm run build:server` | Build only server (TypeScript) |
| `npm run build:ui` | Build only UI (Vite + React) |
| `npm run serve` | Start HTTP server |
| `npm start` | Build and serve |
| `npm run dev` | Development mode with tsx |

### Testing Locally

1. Start the server:
   ```bash
   npm start
   ```

2. Use the [basic-host](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host) from the ext-apps repo:
   ```bash
   cd ext-apps/examples/basic-host
   SERVERS='["http://localhost:3001/mcp"]' npm start
   ```

3. Open http://localhost:8080 and test the `ask_user` tool

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Host Client   │────▶│   MCP Server    │────▶│    React UI     │
│ (Claude, etc.)  │     │  (server.ts)    │     │  (mcp-app.tsx)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │  Tool call with       │  Serves bundled       │
        │  ui/resourceUri       │  HTML via resource    │
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                    postMessage communication
```

### Key Files

- **server.ts**: Registers the `ask_user` tool and `ui://` resource
- **main.ts**: Entry point supporting HTTP and stdio transports
- **mcp-app.tsx**: React UI with multi-question state management
- **vite.config.ts**: Bundles UI into single HTML file via `vite-plugin-singlefile`

### UI Components

| Component | Purpose |
|-----------|---------|
| `TabBar` | Horizontal tab navigation with checkboxes and Submit tab |
| `QuestionPanel` | Renders individual question content |
| `SubmitTab` | Review page showing all answers before submission |
| `OptionList` / `OptionButton` | Option selection UI |
| `OtherInput` | Custom text input option |

### Navigation Hooks

| Hook | Purpose |
|------|---------|
| `useTabNavigation` | Handles Tab/Shift+Tab and arrow key navigation between tabs |
| `useOptionNavigation` | Handles arrow key navigation and Enter/Space selection within options |

## Dependencies

- `@modelcontextprotocol/ext-apps` - MCP Apps SDK
- `@modelcontextprotocol/sdk` - Core MCP SDK
- `react` / `react-dom` - UI framework
- `express` / `cors` - HTTP server
- `zod` - Schema validation
- `tailwindcss` - Styling

## License

MIT
