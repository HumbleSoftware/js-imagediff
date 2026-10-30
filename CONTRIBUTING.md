# Contributing

See the Development section of the [README](README.md) for local setup and scripts.

## Commit messages and PR titles

Commit messages and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <summary>`, lowercase, imperative, no trailing period. Add a scope (`fix(cli): ...`) only when it helps, and mark breaking changes with `!` (`feat!: ...`).

Types: `feat`, `fix`, `docs`, `test`, `ci`, `build`, `refactor`, `chore`.

Examples from this repo:

```
test: replace Karma/PhantomJS with Playwright
ci: add a dev container
chore: declare the Node version for local development
docs: trim local setup to the essentials
```
