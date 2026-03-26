# Contribution Guide

## Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes with descriptive commits
4. Push to your fork
5. Create a Pull Request

## Commit Message Format

Follow the conventional commits format:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code style changes
refactor: Code refactoring
test: Add or update tests
chore: Project maintenance
```

## Branch Naming

- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`
- Documentation: `docs/doc-name`
- Hotfixes: `hotfix/issue-name`

## Pull Request Process

1. Update documentation
2. Add/update tests
3. Ensure all checks pass
4. Request code review
5. Address review comments
6. Squash commits if needed
7. Merge to main

## Code Style

- Use TypeScript strict mode
- Run `npm run lint` before committing
- Run `npm run format` to auto-format code
- Aim for > 80% test coverage

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Building for Production

```bash
npm run build
npm start
```

## Need Help?

- Check the README.md
- Review API documentation in Swagger UI
- Check issue tracker
- Start a discussion
