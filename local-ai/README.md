# Local Coder: your own coding assistant with your skills

A chat app that runs **on your computer** with a **free coding model**, and uses every skill in this repo's `.claude/skills/` folder, including ones you add later.

- Picks the right skill for each request automatically, or use `/skill-name` (e.g. `/lego a red fire truck`).
- Attach repo files from the left panel as context.
- Each code block has **Copy** and **Save to file** (asks first, and only inside this repo). Shell commands are never run by the app: copy them into your terminal and paste the output back if something fails.
- No internet, account or API key needed after setup.

## Setup (once)

1. **Install Node.js 20+**: https://nodejs.org
2. **Install Ollama**: https://ollama.com/download (Windows, Mac, Linux).
3. **Download a coding model** that fits your computer:

| Your computer | Command | Download | Licence |
|---|---|---|---|
| Any laptop, 8–16 GB RAM | `ollama pull qwen2.5-coder:7b` | ~4.7 GB | Apache 2.0 |
| 16–24 GB RAM, or a GPU with 12 GB+ | `ollama pull qwen2.5-coder:14b` | ~9 GB | Apache 2.0 |
| 32 GB+ RAM, or a GPU with 24 GB | `ollama pull devstral` | ~14 GB | Apache 2.0 |
| A GPU with 16 GB+ | `ollama pull gpt-oss:20b` | ~13 GB | Apache 2.0 |

Apache 2.0 allows commercial use. Check the model's page on ollama.com for its current licence before you rely on it.

4. **Start it** from the repo folder:

```sh
node local-ai/server.mjs
```

Then open **http://localhost:8787**. To use a different default model: `MODEL=devstral node local-ai/server.mjs`.

## How the skills are used

The model isn't retrained. For each message the server compares your words with every skill's name and description, and puts the best match (up to about 9,000 characters of its `SKILL.md`) into the model's instructions. Claude uses skills the same way, so **a new skill works as soon as you add its folder**.

## The project notes

Every request also includes the repo's `CLAUDE.md` (the first ~8,000 characters): what the projects are, the owner's preferences, the safety rules and lessons from earlier sessions. To teach the model something lasting, add it to `CLAUDE.md`. It's read fresh on every message, so no restart is needed.

## Safety

- The server listens only on your own computer (127.0.0.1).
- Every request needs a secret token that changes on each start and is only known to the page the server serves, and requests from other websites are refused. Another site open in your browser can't read or write your files through it.
- It can only read and write inside this repo, and it writes only after you confirm. **Save** replaces a file if it exists: use git (`git diff`, `git checkout -- <file>`) to undo.
- It never runs shell commands.

## Honest limits

- A 7B–14B local model is much weaker than Claude. Expect good results for web pages, scripts, fixes and explanations, and weak results for long multi-step jobs: the film, LEGO and anatomy skills rely on many tools and self-checks a small model can't do on its own.
- Small models have small memory (context), so very long skills are cut to their first ~9,000 characters.

## Files

- `server.mjs`: the local server (no npm packages): skills, Ollama streaming, file read and write.
- `index.html`: the chat page.
