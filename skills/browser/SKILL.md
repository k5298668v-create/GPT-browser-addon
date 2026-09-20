# Browser Skill

## Purpose

Use Brave as the browser controlled by the LocalEngineer agent.

## Capabilities

The browser agent may:

- Open webpages
- Inspect webpages
- Read page content
- Click elements
- Type into forms
- Scroll
- Navigate backward and forward
- Take screenshots
- Manage browser tabs

## Workflow

1. Inspect the current browser state before acting.
2. Prefer stable selectors.
3. Verify the result after every important action.
4. Ask for confirmation before submitting sensitive forms.
5. Never make purchases without explicit user confirmation.
6. Never expose passwords, API keys, cookies, or authentication tokens.

## Browser

The browser is Brave.

The agent communicates with Brave through the local browser automation layer.
