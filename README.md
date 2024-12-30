# Create Web App [![Release](https://github.com/hotdogc1017/create-web-app/actions/workflows/release.yml/badge.svg)](https://github.com/hotdogc1017/create-web-app/actions/workflows/release.yml)

[English](README-EN.md)

> 核心代码来自于[create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)

## 项目简介
这是一个用于创建现代Web应用程序的项目模板。它从`create-vite`项目中衍生而来，拓展了[更多](#功能特性)实用的开发工具。

> 目前仅支持 Vite + React(TS)，后续计划支持更多的脚手架工具(eg. [Rspack](https://github.com/web-infra-dev/rspack))和语言框架(Vue - 下个进度)

## 使用

创建项目
```bash
npx @hotdogc1017/create-web-app
```

> 如果要从当前目录创建项目，在提示输入项目名称时，直接回车即可

查看帮助
```bash
npx @hotdogc1017/create-web-app --help # or -h
```

查看版本
```bash
npx @hotdogc1017/create-web-app --version # or -v
```

## 功能特性

### 实用工具
#### [bumpp](https://github.com/antfu/bumpp)
自动更新版本号, 严格遵循[语义化版本规范](https://semver.org/)
```bash
npm bumpp
```

#### [@antfu/eslint-config](https://github.com/antfu/eslint-config)
代码检查与格式化一体的ESLint配置
```bash
npm run lint
npm run lint:fix
```

#### [rimraf](https://github.com/isaacs/rimraf#readme)
快速删除文件和文件夹
```bash
npm run clean
```

### 预配置
 - GitHub Workflows: 在推送代码到仓库时会自动生成changelog, 由[changelogithub](https://github.com/antfu/changelogithub)驱动

## 贡献指南
欢迎任何形式的贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解更多信息。

## 许可证
本项目采用 [Apache-2.0 许可证](LICENSE)。

