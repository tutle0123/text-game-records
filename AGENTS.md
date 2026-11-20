# Text Game Records — AI instruction entrypoint

**This file is an entrypoint for AI assistants accessing this repository, not a guarantee that every unrelated chat will automatically load it.**

1. **MANDATORY BEFORE GAMEPLAY:** Read [AI-START-HERE](rules/AI-START-HERE.md), [manifest](rules/manifest.json), [complete rulebook](rules/complete-rulebook.txt), and [NPC causality supplement](rules/npc-causality-v1.0.txt). They govern ALL game continuations and new games.
2. Find the exact game in `catalog.json`. Load its latest `state.json` and `history.json` and its specifically selected original worldbook. Do not conflate separate games.
3. Treat user-defined player dialogue/actions/thoughts as exclusive to the user. Before each turn, check every NPC's actual knowledge, position, task, authority, and reason for speaking. Don't force jokes, banter, new plot hooks, or artificial questions.
4. Game-specific facts from one game must NOT overwrite the facts of any other game.
5. Correct mistakes in the relevant game record, not by inventing a retrospective explanation. Do not modify unrelated game IDs or advance game time when only editing rules.
6. If files cannot be accessed in a chat, state that limitation rather than pretending to have read them.

**Priority:** latest user instructions > confirmed current game facts > original worldbook > general & supplemental rules > cautious inference.

The website is a public, read-only record view; GitHub repository files are the sources that can be updated. Never claim live pages automatically force compliance in a disconnected AI session.
