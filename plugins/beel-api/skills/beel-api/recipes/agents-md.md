# Recipe: BeeL.'s critical rules in AGENTS.md / CLAUDE.md

BeeL. publishes a short block for a repository's agent instructions: where the docs are, how to authenticate, and the fiscal rules marked critical, each linked to its rule page. It is generated from the rules catalogue, so **copy it from the docs, never write it from memory or edit it by hand**. The source is the "Give your agent the rules" section of [docs.beel.es/ai-agents](https://docs.beel.es/ai-agents).

## Steps

1. **Pick the file.** Use the instructions file the project already has: `AGENTS.md`, or `CLAUDE.md`. If it has neither, ask the user which one to create. Ask before editing either.
2. **Fetch the block.** It is the first `md` code block of the page's Markdown twin:

   ```bash
   curl -s https://docs.beel.es/ai-agents.md | awk '/^```md/{f=1;next} f&&/^```/{exit} f' > /tmp/beel-agents-block.md
   ```

   If the output is empty, the page moved or changed shape. Stop and point the user to `https://docs.beel.es/ai-agents` instead of reconstructing the block.
3. **Insert it between markers**, replacing whatever sits between them if they already exist, so the next refresh is a clean swap:

   ```md
   <!-- BEGIN BeeL. rules (from https://docs.beel.es/ai-agents, do not edit) -->
   …the fetched block, verbatim…
   <!-- END BeeL. rules -->
   ```

4. **Validate.** Check that the markers appear exactly once, that the block matches the fetched file byte for byte, and that every rule ID it links (`LIF-001`, …) resolves: `/beel-api:rules` looks any of them up. If a check fails, redo step 3.

## Keep it current

The block changes when the critical rules do. Refresh it after a BeeL. release (see `https://docs.beel.es/changelog/llms.txt`) by rerunning steps 2 to 4. `/beel-api:upgrade` and `/beel-api:audit` should flag a block that differs from the published one.

## What it is not

The block is a pointer and a short list of never-break rules, not the rulebook. For design and review work, use `/beel-api:rules`, which covers every rule, including the ones BeeL. does not check for you.
