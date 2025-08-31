# Contributing to ARANDU

## 🤝 **Welcome Contributors!**

Thank you for your interest in contributing to ARANDU! This document provides guidelines for contributing to our educational blockchain platform.

## 🚀 **Quick Start**

### 1. Fork & Clone

```bash
git fork https://github.com/moises-cisneros/arandu_app
git clone https://github.com/moises-cisneros/arandu_app
cd arandu_app
yarn install
```

### 2. Set Up Development Environment

```bash
# Install dependencies
yarn install

# Compile contracts
yarn compile

# Run tests to ensure everything works
yarn test
```

## 🧪 **Development Workflow**

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow our coding standards (see `.cursor-rules`)
- Add tests for new functionality
- Update documentation if needed

### 3. Test Your Changes

```bash
yarn test               # All tests must pass
yarn compile           # Contracts must compile
```

### 4. Commit & Push

```bash
git add .
git commit -m "feat: add amazing feature"
git push origin feature/your-feature-name
```

### 5. Create Pull Request

- Describe your changes clearly
- Reference any related issues
- Ensure all tests pass

## 📋 **Coding Standards**

### Solidity Contracts

- Use Solidity `^0.8.20`
- Import from `@openzeppelin/contracts`
- Include detailed NatSpec comments
- Protect critical functions with `onlyOwner`
- Follow Checks-Effects-Interactions pattern

### JavaScript/Testing

- Use BDD style with `describe`, `context`, `it`
- Name test files by User Story (HU01, HU02, etc.)
- Include `console.log` for scenario traceability
- Use `expect` syntax from Chai

### Documentation

- Keep README concise and impactful
- Technical details go in TECHNICAL.md
- Use clear, descriptive language
- Include code examples

## 🎯 **Areas for Contribution**

### High Priority

- Frontend React components
- Additional gamification features
- Mobile-responsive design
- Performance optimizations

### Medium Priority

- Additional test coverage
- Documentation improvements
- Deployment automation
- Monitoring tools

### Future Features

- Multi-language support
- Advanced analytics
- Parent/guardian portal
- Government integration APIs

## 🐛 **Bug Reports**

### Before Submitting

1. Check existing issues
2. Reproduce the bug
3. Test on latest version

### Include in Report

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, network, etc.)

## 💡 **Feature Requests**

### Guidelines

- Align with educational mission
- Consider impact on students and teachers
- Provide clear use case
- Think about implementation complexity

## 📚 **Resources**

- [Technical Documentation](./TECHNICAL.md)
- [Smart Contract Documentation](./docs/contracts-architecture-diagrams.md)
- [User Stories](./docs/user-stories-sequence-diagrams.md)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Documentation](https://docs.openzeppelin.com/)

## 🏆 **Recognition**

Contributors will be recognized in:

- Project documentation
- Release notes
- Community showcases

## 📞 **Contact**

- **Issues**: Use GitHub Issues
- **Discussions**: Use GitHub Discussions
- **Direct Contact**: [Your contact method]

---

**Together, let's transform education in Latin America!** 🇧🇴✨
