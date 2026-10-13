import { createHash } from 'node:crypto'
import { readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformAsync } from '@babel/core'
import presetEnv from '@babel/preset-env'
import { parse } from 'acorn'
import { minify } from 'terser'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(projectRoot, 'dist')
const assetsDir = join(distDir, 'assets')
const htmlPath = join(distDir, 'index.html')
const systemJsPath = join(projectRoot, 'node_modules', 'systemjs', 'dist', 's.min.js')

const assetNames = await readdir(assetsDir)
const legacyNames = assetNames.filter((name) => /^[\w-]+-legacy-[\w-]+\.js$/.test(name))

if (
  legacyNames.length < 2
  || !legacyNames.some((name) => name.startsWith('polyfills-legacy-'))
  || !legacyNames.some((name) => name.startsWith('index-legacy-'))
) {
  throw new Error(`Expected legacy polyfill and application bundles, found: ${legacyNames.join(', ')}`)
}

async function finalizeBundle(sourceName) {
  const sourcePath = join(assetsDir, sourceName)
  const source = await readFile(sourcePath, 'utf8')

  const transformed = await transformAsync(source, {
    babelrc: false,
    configFile: false,
    comments: false,
    compact: true,
    sourceType: 'script',
    presets: [
      [
        presetEnv,
        {
          bugfixes: true,
          forceAllTransforms: true,
          modules: false,
          targets: { ie: '11' },
        },
      ],
    ],
  })

  if (!transformed?.code) {
    throw new Error(`Babel did not transform ${sourceName}`)
  }

  const minimized = await minify(transformed.code, {
    ecma: 5,
    compress: {
      arrows: false,
      ecma: 5,
    },
    mangle: {
      safari10: true,
    },
    format: {
      comments: false,
      ecma: 5,
      safari10: true,
    },
  })

  if (!minimized.code) {
    throw new Error(`Terser did not finalize ${sourceName}`)
  }

  // Fail the build if any ES2015 syntax survived. This protects Telegram iOS
  // from receiving files that only appear to be legacy bundles.
  parse(minimized.code, { ecmaVersion: 5, sourceType: 'script' })

  const content = `${minimized.code}\n`
  const contentHash = createHash('sha256').update(content).digest('hex').slice(0, 12)
  const stem = sourceName.replace(/-[^-]+\.js$/, '')
  const finalName = `${stem}-es5-${contentHash}.js`
  const finalPath = join(assetsDir, finalName)

  await writeFile(finalPath, content, 'utf8')
  if (finalPath !== sourcePath) await unlink(sourcePath)

  return { finalName, sourceName }
}

const finalizedBundles = []
for (const sourceName of legacyNames) {
  finalizedBundles.push(await finalizeBundle(sourceName))
}

let html = await readFile(htmlPath, 'utf8')
for (const { finalName, sourceName } of finalizedBundles) {
  if (!html.includes(sourceName)) {
    throw new Error(`Could not find ${sourceName} in the generated HTML`)
  }
  html = html.replaceAll(sourceName, finalName)
}

// Telegram iOS did not finish the external polyfill bundle before executing
// the generated System.import call. Keep the tiny official SystemJS loader
// inline and before all generated legacy scripts so `System` always exists.
const systemJsSource = await readFile(systemJsPath, 'utf8')
parse(systemJsSource, { ecmaVersion: 5, sourceType: 'script' })

if (/<\/script/i.test(systemJsSource)) {
  throw new Error('SystemJS loader cannot be safely embedded in HTML')
}

const polyfillTag = '<script crossorigin id="vite-legacy-polyfill"'
if (!html.includes(polyfillTag)) {
  throw new Error('Could not find the generated legacy polyfill tag')
}

html = html.replace(
  polyfillTag,
  `<script id="telegram-systemjs-loader">${systemJsSource}</script>\n    ${polyfillTag}`,
)

await writeFile(htmlPath, html, 'utf8')

console.log(
  `Finalized ES5 Telegram bundles: ${finalizedBundles.map(({ finalName }) => finalName).join(', ')}`,
)
