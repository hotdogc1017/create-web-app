# Create Web App [![Release](https://github.com/hotdogc1017/create-web-app/actions/workflows/release.yml/badge.svg)](https://github.com/hotdogc1017/create-web-app/actions/workflows/release.yml)

[简体中文](README.md)

> Core code derived from [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)

## Project Introduction
This is a project template for creating modern web applications. It is derived from the `create-vite` project and extends [more](#features) useful development tools.

## Usage

Create project
```bash
npx @hotdogc1017/create-web-app@latest
```

> To create a project from the current directory, simply press Enter when prompted for the project name

View help
```bash
npx @hotdogc1017/create-web-app@latest --help # or -h
```

View version
```bash
npx @hotdogc1017/create-web-app@latest --version # or -v
```

## Features

### Utilities
#### [bumpp](https://github.com/antfu/bumpp)
Automatically update version numbers, strictly following the [Semantic Versioning Specification](https://semver.org/)
```bash
npm bumpp
```

#### [@antfu/eslint-config](https://github.com/antfu/eslint-config)
ESLint configuration for code checking and formatting
```bash
npm run lint
npm run lint:fix
```

#### [rimraf](https://github.com/isaacs/rimraf#readme)
Quickly delete files and folders
```bash
npm run clean
```

### Pre-configured
 - GitHub Workflows: Automatically generates changelog when pushing code to the repository, powered by [changelogithub](https://github.com/antfu/changelogithub)

## Contribution Guide
Any form of contribution is welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## License
This project is licensed under the [Apache-2.0 License](LICENSE).
