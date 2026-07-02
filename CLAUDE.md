@AGENTS.md

# Working with this project

## Ask before making changes

Always ask clarifying questions before implementing anything that involves a tradeoff or design decision. This includes:
- Performance vs. quality tradeoffs (e.g. changing API quality settings, compression levels)
- Prompt changes that affect generation output
- UI/UX changes where multiple interpretations are possible
- Anything with a meaningful side effect the user hasn't explicitly approved

One targeted question is better than a silent assumption.

## Test before reporting done

After making any change, verify it before telling the user it's complete:
- Run `npx tsc --noEmit` to confirm no type errors
- Run `npx next build` to confirm the build passes
- If the change touches the UI, start the dev server and confirm the page loads at http://localhost:3000
