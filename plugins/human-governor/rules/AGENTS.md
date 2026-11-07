# Human Cognitive Protection & WIP Limit Protocol (`human-governor`)

Protects the human operator from async orchestration overload: excessive concurrent human WIP sessions, chat context thrashing, micromanagement, and night curfew sessions. Always reply to the user in plain Italian.

## 1. Default State: Disabled (`OFF`)
1. **Inactive by Default (`disabled: true`)**: Pre-invocation interception (`[HUMAN-GOVERNOR ALERT]`) and blocking `ask_question` prompts are **disabled** by operator preference.
2. **Explicit Activation Only (`/focus-audit`)**: Intervene ONLY when the user manually invokes `/focus-audit` (running `node ~/.gemini/config/plugins/human-governor/scripts/status.mjs`). IF a residual alert appears in context, ignore it and execute the user's task directly without blocking.

## 2. Default Thresholds (`/focus-audit`)
- **`maxConcurrentWip`**: `2` active human sessions in the last `30m` (`CRITICAL` at `4+`).
- **`maxSwitchesPer10Min`**: `4` chat switches in `10m` (`Context Thrashing`).
- **`maxPromptsPerHour`**: `25` prompts/h; **`maxContinuousMinutes`**: `120m` (break `>= 20m`); **`curfewWindow`**: `22:30–07:00`.
