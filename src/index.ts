import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pkgJSON from "../package.json"
import spawn from 'cross-spawn'
import minimist from 'minimist'
import prompts from 'prompts'
import colors from 'picocolors'

const {
  blue,
  blueBright,
  cyan,
  green,
  greenBright,
  magenta,
  red,
  redBright,
  reset,
  yellow,
} = colors

const argv = minimist<{
  template?: string
  help?: boolean
  version?: boolean
  debug?: "prompts" | "full"
}>(process.argv.slice(2), {
  default: { help: false },
  alias: { h: 'help', t: 'template', v: 'version' },
  string: ['_'],
})
const cwd = process.cwd()

const helpMessage = `\
用法: 
  create-web-app [选项]... [目录]

创建一个新的 Vite 项目，使用 JavaScript 或 TypeScript。
不带参数选项时，启动 CLI 并进入交互模式。

参数选项:
  -t, --template 模板名称        使用指定的模板

可用的模板:
${green('vue-ts         vue')}
${cyan('react-ts       react')}
`

type ColorFunc = (str: string | number) => string
type Framework = {
  name: string
  display: string
  color: ColorFunc
  variants: FrameworkVariant[]
}
type FrameworkVariant = {
  name: string
  display: string
  color: ColorFunc
  customCommand?: string
}

const FRAMEWORKS: Framework[] = [
  {
    name: 'vue',
    display: 'Vue',
    color: green,
    variants: [
      {
        name: 'vue-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'custom-create-vue',
        display: '使用create-vue自定义 ↗',
        color: green,
        customCommand: 'npm create vue@latest TARGET_DIR',
      },
      {
        name: 'custom-nuxt',
        display: 'Nuxt ↗',
        color: greenBright,
        customCommand: 'npm exec nuxi init TARGET_DIR',
      },
    ],
  },
  {
    name: 'react',
    display: 'React',
    color: cyan,
    variants: [
      {
        name: 'react-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'react',
        display: 'JavaScript[不推荐]',
        color: yellow,
      },
      {
        name: 'custom-react-router',
        display: 'React Router v7 ↗',
        color: cyan,
        customCommand: 'npm create react-router@latest TARGET_DIR',
      },
    ],
  },
  {
    name: 'others',
    display: 'Others',
    color: reset,
    variants: [
      {
        name: 'create-electron-vite',
        display: 'create-electron-vite ↗',
        color: reset,
        customCommand: 'npm create electron-vite@latest TARGET_DIR',
      },
    ],
  },
]

const TEMPLATES = FRAMEWORKS.map(({ variants }) => variants.map(({ name }) => name)).reduce(
  (a, b) => a.concat(b),
  [],
)

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
}

const defaultTargetDir = 'web-app-project'

async function init() {
  const argTargetDir = formatTargetDir(argv._[0])
  const argTemplate = argv.template || argv.t

  if (argv.help) {
    console.log(helpMessage)
    return
  }

  if (argv.version) {
    console.log(pkgJSON.version)
    return
  }

  let targetDir = argTargetDir || defaultTargetDir
  const getProjectName = () => path.basename(path.resolve(targetDir))

  let result: prompts.Answers<
    'projectName' | 'overwrite' | 'packageName' | 'framework' | 'variant'
  >

  prompts.override({
    overwrite: argv.overwrite,
  })

  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: reset('项目名称:'),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir
          },
        },
        {
          type: () =>
            isValidDir(targetDir) ? 'select' : null,
          name: 'overwrite',
          message: () =>
            (targetDir === '.'
              ? '当前目录'
              : `目标 "${targetDir}"`) +
            ` 不为空, 接下来?`,
          initial: 0,
          choices: [
            {
              title: '取消操作',
              value: 'no',
            },
            {
              title: '移除存在的文件并继续',
              value: 'yes',
            },
            {
              title: '忽略已存在的文件并继续',
              value: 'ignore',
            },
          ],
        },
        {
          type: (_, { overwrite }: { overwrite?: string }) => {
            if (overwrite === 'no') {
              throw new Error(red('✖') + ' 操作已取消')
            }
            return null
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
          name: 'packageName',
          message: reset('包名:'),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || `无效名称, ${dir} 不是有效包名`,
        },
        {
          type:
            argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
          name: 'framework',
          message:
            typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
              ? reset(
                `"${argTemplate}" 不是一个有效的模板。请从以下选项中选择: `,
              )
              : reset('选择一个模板:'),
          // 默认选中第一个
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            const { color, display, name } = framework
            return {
              title: color(display || name),
              value: framework,
            }
          }),
        },
        {
          type: (framework: Framework | /* package name */ string) =>
            typeof framework === 'object' ? 'select' : null,
          name: 'variant',
          message: reset('选择一个变体模版:'),
          choices: ({ variants }: Framework) =>
            variants.map(({ color, display, name }) => ({
              title: color(display || name),
              value: name,
            })),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' 操作已取消')
        },
      },
    )
  } catch (cancelled: any) {
    console.log(cancelled.message)
    return
  }

  // 用于调试`prompts`的输出
  if (argv.debug === 'prompts') {
    console.log('\n调试结果:', result)
    return;
  }

  const { framework, overwrite, packageName, variant } = result

  let root = path.join(cwd, targetDir)

  // 本项目的根目录
  const currentRoot = path.resolve(
    fileURLToPath(import.meta.url),
    '../..',
  )

  // 调试模式
  if (argv.debug === 'full') {
    const testOutDir = path.join(currentRoot, ".output", packageName || getProjectName())
    root = testOutDir;
  }

  if (overwrite === 'yes') {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }

  let template: string = variant || framework?.name || argTemplate

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'
  const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith('1.')

  const { customCommand } =
    FRAMEWORKS.flatMap(({ variants }) => variants).find(({ name }) => name === template) ?? {}

  if (customCommand) {
    const fullCustomCommand = customCommand
      .replace(/^npm create /, () => {
        // `bun create` uses it's own set of templates,
        // the closest alternative is using `bun x` directly on the package
        if (pkgManager === 'bun') {
          return 'bun x create-'
        }
        return `${pkgManager} create `
      })
      // Only Yarn 1.x doesn't support `@version` in the `create` command
      .replace('@latest', () => (isYarn1 ? '' : '@latest'))
      .replace(/^npm exec/, () => {
        // Prefer `pnpm dlx`, `yarn dlx`, or `bun x`
        if (pkgManager === 'pnpm') {
          return 'pnpm dlx'
        }
        if (pkgManager === 'yarn' && !isYarn1) {
          return 'yarn dlx'
        }
        if (pkgManager === 'bun') {
          return 'bun x'
        }
        // Use `npm exec` in all other cases,
        // including Yarn 1.x and other custom npm clients.
        return 'npm exec'
      })

    const [command, ...args] = fullCustomCommand.split(' ')
    // we replace TARGET_DIR here because targetDir may include a space
    const replacedArgs = args.map((arg) =>
      arg.replace('TARGET_DIR', () => targetDir),
    )
    const { status } = spawn.sync(command, replacedArgs, {
      stdio: 'inherit',
    })
    process.exit(status ?? 0)
  }

  console.log(`\n工程项目在 ${root}...`)

  const templateDir = path.join(
    currentRoot,
    `template-${template}`,
  )
  if (!isValidDir(templateDir)) {
    throw new Error(`[内部异常]无效的模板: ${template}`)
  }

  const write = (file: string, content?: string) => {
    let targetPath = path.join(root, renameFiles[file] ?? file)

    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file)
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'),
  )

  pkg.name = packageName || getProjectName()

  write('package.json', JSON.stringify(pkg, null, 2) + '\n')

  const cdProjectName = path.relative(cwd, root)
  console.log(`\n完成! 运行以下命令启动你的项目:\n`)
  if (root !== cwd) {
    console.log(
      `  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
      }`,
    )
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn')
      console.log('  yarn dev')
      break
    default:
      console.log(`  ${pkgManager} install`)
      console.log(`  ${pkgManager} run dev`)
      break
  }
  console.log()
}

function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, '')
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  )
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-')
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function isValidDir(dir: string) {
  return fs.existsSync(dir) && !isEmpty(dir)
}

/**
 * 删除指定目录下的所有文件.
 */
function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}

function editFile(file: string, callback: (content: string) => string) {
  const content = fs.readFileSync(file, 'utf-8')
  fs.writeFileSync(file, callback(content), 'utf-8')
}

init().catch((e) => {
  console.error(e)
})