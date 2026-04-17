export const landingHtml = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Ask User MCP App</title>
<meta name="description" content="An MCP App that lets AI agents ask users multiple-choice questions inline in the conversation." />
<style>
  :root {
    --surface: #ffffff;
    --surface-elevated: #faf8f5;
    --surface-warm: #f5f1eb;
    --accent: #c4704b;
    --accent-hover: #b0613d;
    --text-primary: #1a1815;
    --text-secondary: #6b635a;
    --text-muted: #9c948a;
    --border: #e8e4de;
    --code-bg: #f5f1eb;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --surface: #1c1a17;
      --surface-elevated: #252320;
      --surface-warm: #2a2724;
      --accent: #d4896b;
      --accent-hover: #e09a7e;
      --text-primary: #f5f2ed;
      --text-secondary: #a8a099;
      --text-muted: #6b655e;
      --border: #3a3632;
      --code-bg: #2a2724;
    }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    background: var(--surface);
    color: var(--text-primary);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .container { max-width: 760px; margin: 0 auto; padding: 64px 24px 96px; }
  header { margin-bottom: 48px; }
  .eyebrow {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 12px;
  }
  h1 { font-size: 40px; line-height: 1.15; margin: 0 0 16px; letter-spacing: -0.02em; }
  .lede { font-size: 18px; color: var(--text-secondary); margin: 0; }
  h2 { font-size: 22px; margin: 48px 0 16px; letter-spacing: -0.01em; }
  h3 { font-size: 16px; margin: 24px 0 8px; color: var(--text-secondary); font-weight: 600; }
  p { color: var(--text-secondary); margin: 0 0 16px; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { color: var(--accent-hover); text-decoration: underline; }
  ul { padding-left: 20px; color: var(--text-secondary); }
  li { margin-bottom: 6px; }
  code {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 13px;
    background: var(--code-bg);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-primary);
  }
  pre {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 18px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-primary);
  }
  pre code { background: none; padding: 0; font-size: inherit; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    margin-bottom: 8px;
  }
  th, td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }
  th { font-weight: 600; color: var(--text-primary); background: var(--surface-elevated); }
  td { color: var(--text-secondary); }
  td code { font-size: 12.5px; }
  .card {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px 22px;
    margin-bottom: 16px;
  }
  .card h3 { margin-top: 0; color: var(--text-primary); }
  .endpoint {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--surface-warm);
    border: 1px solid var(--border);
    padding: 6px 12px;
    border-radius: 999px;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 13px;
    color: var(--text-primary);
  }
  .endpoint .dot { width: 6px; height: 6px; border-radius: 50%; background: #5a8a5a; }
  footer {
    margin-top: 64px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
    font-size: 13px;
    color: var(--text-muted);
  }
  footer a { color: var(--text-secondary); }
</style>
</head>
<body>
  <div class="container">
    <header>
      <span class="eyebrow">MCP App</span>
      <h1>Ask User</h1>
      <p class="lede">
        An MCP App that lets AI agents ask users multiple-choice questions with
        tab-based navigation, keyboard support, and custom text input &mdash;
        rendered inline in the conversation.
      </p>
      <p style="margin-top: 20px;">
        <span class="endpoint"><span class="dot"></span> POST /mcp</span>
      </p>
    </header>

    <section>
      <h2>Install in Claude.ai</h2>
      <p>Use the hosted MCP server directly with Claude's connector feature:</p>
      <ol style="color: var(--text-secondary); padding-left: 20px;">
        <li>Open <a href="https://claude.ai">Claude.ai</a> and go to <strong>Settings &rarr; Connectors</strong>.</li>
        <li>Click <strong>Add custom connector</strong>.</li>
        <li>Enter the remote MCP server URL:<br />
          <code>https://ask-user-mcp-app-seven.vercel.app/mcp</code>
        </li>
        <li>Save and start a new conversation &mdash; the <code>ask_user</code> tool will be available.</li>
      </ol>
    </section>

    <section>
      <h2>Features</h2>
      <ul>
        <li><strong>Multi-question tabs</strong> &mdash; ask several questions, displayed as navigable tabs.</li>
        <li><strong>Keyboard navigation</strong> &mdash; Tab/Shift+Tab for tabs, arrows for options, Enter to select.</li>
        <li><strong>Single or multi-select</strong> &mdash; radio or checkbox style per question.</li>
        <li><strong>Custom "Other" input</strong> &mdash; free-form text when the options don't fit.</li>
        <li><strong>Theme-aware</strong> &mdash; adapts to the host's light/dark theme.</li>
      </ul>
    </section>

    <section>
      <h2>Tool Schema</h2>
      <p>The <code>ask_user</code> tool accepts a <code>questions</code> array. Each question renders as a tab.</p>

      <h3>Question object</h3>
      <table>
        <thead>
          <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>question</code></td><td>string</td><td>Yes</td><td>Question text (also used as unique identifier).</td></tr>
          <tr><td><code>header</code></td><td>string</td><td>Yes</td><td>Short tab label (max 12 chars).</td></tr>
          <tr><td><code>options</code></td><td>array</td><td>Yes</td><td>2&ndash;4 choices with <code>label</code>, <code>value</code>, optional <code>description</code>.</td></tr>
          <tr><td><code>multiSelect</code></td><td>boolean</td><td>No</td><td>Allow multiple selections. Default <code>false</code>.</td></tr>
          <tr><td><code>allowOther</code></td><td>boolean</td><td>No</td><td>Include "Other" text input. Default <code>true</code>.</td></tr>
          <tr><td><code>required</code></td><td>boolean</td><td>No</td><td>Must be answered. Default <code>false</code>.</td></tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Example call</h2>
      <pre><code>{
  "name": "ask_user",
  "arguments": {
    "questions": [
      {
        "question": "Which frontend framework?",
        "header": "Framework",
        "options": [
          { "label": "React",  "value": "react" },
          { "label": "Vue",    "value": "vue" },
          { "label": "Svelte", "value": "svelte" }
        ],
        "required": true
      },
      {
        "question": "Which testing tools?",
        "header": "Testing",
        "options": [
          { "label": "Jest",       "value": "jest" },
          { "label": "Vitest",     "value": "vitest" },
          { "label": "Playwright", "value": "playwright" }
        ],
        "multiSelect": true
      }
    ]
  }
}</code></pre>

      <h3>Response format</h3>
      <pre><code>Which frontend framework? -&gt; React
Which testing tools? -&gt; Vitest, Playwright</code></pre>
    </section>

    <section>
      <h2>Run locally (stdio)</h2>
      <p>For Claude Desktop or other stdio hosts:</p>
      <pre><code>git clone https://github.com/ergunsh/ask-user-mcp-app
cd ask-user-mcp-app
npm install
npm run build</code></pre>
      <p>Then add to <code>claude_desktop_config.json</code>:</p>
      <pre><code>{
  "mcpServers": {
    "ask-user": {
      "command": "node",
      "args": ["/absolute/path/to/ask-user-mcp-app/dist/main.js", "--stdio"]
    }
  }
}</code></pre>
    </section>

    <footer>
      <p>
        <a href="https://github.com/ergunsh/ask-user-mcp-app">GitHub</a>
        &nbsp;&middot;&nbsp;
        <a href="https://modelcontextprotocol.io/docs/extensions/apps">MCP Apps docs</a>
        &nbsp;&middot;&nbsp;
        MIT License
      </p>
    </footer>
  </div>
</body>
</html>`;
