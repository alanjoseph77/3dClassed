# Source

- Origin: https://github.com/xikhar/papercraft (MIT, see `LICENSE`, copyright Shikhar)
- Commit: 5eea4eb004727f03492cfb40309224e150475002
- Copied: the whole `skills/papercraft/` folder (SKILL.md, references, assets, scripts). Left out: repo-level README and `.gitattributes`.
- Needs here: Python 3 with numpy and Pillow for `scripts/` (capture, measure, textures); a browser to view. No hooks, no installers, no auto-updates.
- Heads-up: the templates load three.js r187 from a CDN. cdn.jsdelivr.net/unpkg are blocked in the cloud and the owner wants single offline files, so inline three.js (`npm i three`, paste the min build) when delivering.
