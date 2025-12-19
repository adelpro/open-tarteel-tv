# Contributing to Open Tarteel TV

Thank you for your interest in contributing to **Open Tarteel TV**.  
Bug reports, feature suggestions, code contributions, documentation, and testing help are all welcome.

---

## Code of Conduct

- Be respectful and constructive.
- Assume good intent.
- Focus discussions on the code and the product, not on people.

---

## How to Contribute

### 1. Reporting Bugs

- Check existing issues to avoid duplicates.
- Include:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Platform details (Android TV, tvOS, device/emulator, versions)

### 2. Suggesting Features

- Clearly describe the problem the feature solves.
- Explain how it fits the TV-first experience.
- If possible, include mockups or example flows.

### 3. Submitting Changes (Pull Requests)

1. Fork the repository.
2. Create a feature branch from the main branch.
3. Make your changes, keeping them focused and logically grouped.
4. Run the app to make sure it builds and runs cleanly on at least one target:
   - `yarn android` **or**
   - `yarn ios`
5. Update documentation where appropriate:
   - `README.md`
   - `CHANGELOG.md`
6. Open a pull request with:
   - A clear title
   - A short description of what changed and why
   - Screenshots or recordings for UI changes, especially TV focus behavior

---

## Code Style and Practices

- Use TypeScript and keep types explicit where helpful.
- Keep components functional and focused.
- Reuse existing components and hooks when possible.
- Maintain accessibility and TV remote usability.
- Keep translations in `src/locales/` up to date when you introduce new user-facing strings.

---

## Testing and Quality

If you add tests:

- Use Jest and React Testing Library (or similar) for React Native components.
- Prefer small, focused tests.
- Ensure all tests pass before opening a PR.

---

## Attribution and License

By contributing, you agree that your contributions will be licensed under the same license as the project (**MIT**).  
You will be credited via the project history (git commit authorship, pull request records) and any contributor lists the project may maintain.
