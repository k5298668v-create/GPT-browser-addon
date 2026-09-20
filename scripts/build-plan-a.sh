#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo
echo "========================================"
echo " LOCAL ENGINEER — PLAN A BATCH BUILD"
echo "========================================"
echo

TS="npx tsc --noEmit --pretty false"

backup_file() {
  local file="$1"

  if [ -f "$file" ]; then
    cp "$file" "$file.plan-a-backup"
    echo "Backup: $file"
  fi
}

check_ts() {
  echo
  echo "Running TypeScript check..."
  if ! $TS; then
    echo
    echo "❌ TypeScript failed."
    echo "Changes have NOT been committed."
    echo
    echo "Backups:"
    find . -name "*.plan-a-backup" -print
    exit 1
  fi

  echo "✓ TypeScript passes."
}

echo "Checking initial state..."
if ! $TS; then
  echo "❌ Project does not compile before changes."
  echo "Stopping so we don't make the situation harder to debug."
  exit 1
fi

echo "✓ Initial TypeScript check passes."

# ============================================================
# 1. BETTER TASK PARSING
# ============================================================

echo
echo "========================================"
echo "1/4 — BETTER TASK PARSING"
echo "========================================"

backup_file "packages/agent/src/browser-planner.ts"

python3 <<'PY'
from pathlib import Path

p = Path("packages/agent/src/browser-planner.ts")
s = p.read_text()

s = s.replace(
'''  private wantsRead = false;
  private wantsClick = false;
  private targetText = "";
''',
'''  private wantsRead = false;
  private wantsClick = false;
  private wantsType = false;
  private wantsScroll = false;

  private targetText = "";
  private typeText = "";
  private typeTarget = "";
  private scrollDirection: "up" | "down" = "down";
  private scrollAmount = 700;
'''
)

s = s.replace(
'''    this.wantsClick = lower.includes("click");

    if (this.wantsClick) {
      this.targetText = this.extractClickTarget(task);
    }
''',
'''    this.wantsClick = lower.includes("click");

    this.wantsType =
      lower.includes("type") ||
      lower.includes("enter") ||
      lower.includes("fill");

    this.wantsScroll =
      lower.includes("scroll");

    if (this.wantsClick) {
      this.targetText = this.extractClickTarget(task);
    }

    if (this.wantsType) {
      const typeInfo = this.extractTypeTarget(task);

      this.typeText = typeInfo.text;
      this.typeTarget = typeInfo.target;
    }

    if (this.wantsScroll) {
      this.scrollDirection =
        lower.includes("up") ? "up" : "down";

      const amountMatch = lower.match(/(\\d+)\\s*(?:px|pixels)?/);

      if (amountMatch) {
        this.scrollAmount = Number(amountMatch[1]);
      }
    }
'''
)

insert = r'''
  private extractTypeTarget(task: string): {
    text: string;
    target: string;
  } {
    const quoted =
      task.match(
        /(?:type|enter|fill)\s+["']([^"']+)["']\s+(?:into|in)\s+(?:the\s+)?(.+)$/i
      );

    if (quoted) {
      return {
        text: quoted[1],
        target: quoted[2]
          .replace(/\s+(?:field|input|box)$/i, "")
          .trim()
      };
    }

    const fallback =
      task.match(
        /(?:type|enter|fill)\s+(.+?)\s+(?:into|in)\s+(?:the\s+)?(.+)$/i
      );

    if (fallback) {
      return {
        text: fallback[1].trim(),
        target: fallback[2]
          .replace(/\s+(?:field|input|box)$/i, "")
          .trim()
      };
    }

    return {
      text: "",
      target: ""
    };
  }

'''

marker = "  private extractUrl(task: string): string | null {"

if insert not in s:
    s = s.replace(marker, insert + marker)

p.write_text(s)
PY

check_ts

echo "✓ Task parsing expanded."

# ============================================================
# 2. FORM TYPING
# ============================================================

echo
echo "========================================"
echo "2/4 — FORM TYPING"
echo "========================================"

backup_file "packages/tools/src/router.ts"
backup_file "packages/agent/src/browser-planner.ts"

python3 <<'PY'
from pathlib import Path

p = Path("packages/agent/src/browser-planner.ts")
s = p.read_text()

needle = '''    if (this.wantsClick && this.step === 1) {
'''

typing = '''    /*
     * Type workflow:
     *
     * open
     *   ↓
     * inspect
     *   ↓
     * find matching input
     *   ↓
     * type
     */

    if (this.wantsType && this.step === 1) {
      this.step++;

      return {
        name: "browser.inspect",
        arguments: {}
      };
    }

    if (this.wantsType && this.step === 2) {
      const inspection =
        observation?.result as InspectResult | undefined;

      const inputs = inspection?.output?.inputs ?? [];

      const target = inputs.find((input) => {
        const haystack = [
          input.name,
          input.placeholder,
          input.ariaLabel,
          input.type
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(
          this.typeTarget.toLowerCase()
        );
      });

      if (!target) {
        console.log(
          `Planner: Could not find input "${this.typeTarget}".`
        );

        return null;
      }

      this.step++;

      return {
        name: "browser.type",
        arguments: {
          selector: `#${target.id}`,
          text: this.typeText
        }
      };
    }

'''

if typing not in s:
    s = s.replace(needle, typing + needle)

p.write_text(s)
PY

check_ts

echo "✓ Form typing workflow added."

# ============================================================
# 3. MORE ROBUST NAVIGATION
# ============================================================

echo
echo "========================================"
echo "3/4 — MORE ROBUST NAVIGATION"
echo "========================================"

backup_file "packages/browser/src/brave.ts"
backup_file "packages/tools/src/router.ts"

python3 <<'PY'
from pathlib import Path

p = Path("packages/browser/src/brave.ts")
s = p.read_text()

if "async back()" not in s:
    marker = '''  async close(): Promise<void> {
'''

    methods = '''  async back(): Promise<void> {
    const page = this.getPage();

    await page.goBack({
      waitUntil: "domcontentloaded"
    });
  }

  async forward(): Promise<void> {
    const page = this.getPage();

    await page.goForward({
      waitUntil: "domcontentloaded"
    });
  }

'''

    s = s.replace(marker, methods + marker)

p.write_text(s)


p = Path("packages/tools/src/router.ts")
s = p.read_text()

needle = '''      case "browser.open":
'''

replacement = '''      case "browser.back":
        return this.browserTools.back();

      case "browser.forward":
        return this.browserTools.forward();

      case "browser.open":
'''

s = s.replace(needle, replacement)

p.write_text(s)


p = Path("packages/tools/src/browser-tools.ts")
s = p.read_text()

if "async back()" not in s:
    marker = '''  async open(url: string): Promise<ToolResult> {
'''

    methods = '''  async back(): Promise<ToolResult> {
    try {
      await this.browser.back();

      return {
        success: true,
        output: "Navigated back"
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }

  async forward(): Promise<ToolResult> {
    try {
      await this.browser.forward();

      return {
        success: true,
        output: "Navigated forward"
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }

'''

    s = s.replace(marker, methods + marker)

p.write_text(s)
PY

check_ts

echo "✓ Back/forward navigation added."

# ============================================================
# 4. ERROR RECOVERY / RETRY
# ============================================================

echo
echo "========================================"
echo "4/4 — ERROR RECOVERY / RETRY"
echo "========================================"

backup_file "packages/agent/src/agent-loop.ts"

python3 <<'PY'
from pathlib import Path

p = Path("packages/agent/src/agent-loop.ts")
s = p.read_text()

old = '''      const result = await this.tools.execute(call);

      console.log("Observation:");
      console.dir(result, { depth: null });
      console.log();

      observation = {
        tool: call.name,
        result
      };
'''

new = '''      let result: unknown;
      let attempts = 0;
      const maxRetries = 2;

      while (true) {
        try {
          result = await this.tools.execute(call);

          const failed =
            typeof result === "object" &&
            result !== null &&
            "success" in result &&
            (result as { success?: unknown }).success === false;

          if (!failed || attempts >= maxRetries) {
            break;
          }

          attempts++;

          console.log(
            `⚠ Tool failed. Retrying (${attempts}/${maxRetries})...`
          );
        } catch (error) {
          if (attempts >= maxRetries) {
            result = {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : String(error)
            };

            break;
          }

          attempts++;

          console.log(
            `⚠ Tool threw an error. Retrying (${attempts}/${maxRetries})...`
          );
        }
      }

      console.log("Observation:");
      console.dir(result, { depth: null });
      console.log();

      observation = {
        tool: call.name,
        result
      };
'''

if old not in s:
    raise SystemExit(
        "Could not find expected AgentLoop execution block."
    )

s = s.replace(old, new)

p.write_text(s)
PY

check_ts

echo "✓ Error recovery/retry added."

# ============================================================
# CLEANUP
# ============================================================

echo
echo "========================================"
echo " BUILD COMPLETE"
echo "========================================"
echo
echo "TypeScript: ✓"
echo "Task parsing: ✓"
echo "Form typing: ✓"
echo "Navigation: ✓"
echo "Retry handling: ✓"
echo
echo "No git commit was created."
echo "No git push was performed."
echo
echo "Review changes with:"
echo
echo "  git status"
echo "  git diff"
echo
echo "Backups created with:"
echo
echo "  *.plan-a-backup"
echo
echo "If everything looks good, remove backups with:"
echo
echo "  find . -name '*.plan-a-backup' -delete"
echo
