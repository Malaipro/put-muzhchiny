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
const namedRegisterPath = join(projectRoot, 'node_modules', 'systemjs', 'dist', 'extras', 'named-register.min.js')
const appModuleId = 'kemp-app'

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

  return { content, finalName, sourceName }
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

// Keep the complete compatibility bootstrap inside the document. Telegram
// iOS can otherwise fail the separate polyfill request during a deployment
// switch even though the document itself already came from the new release.
const systemJsSource = await readFile(systemJsPath, 'utf8')
parse(systemJsSource, { ecmaVersion: 5, sourceType: 'script' })

if (/<\/script/i.test(systemJsSource)) {
  throw new Error('SystemJS loader cannot be safely embedded in HTML')
}

const polyfillBundle = finalizedBundles.find(({ sourceName }) => sourceName.startsWith('polyfills-legacy-'))
if (!polyfillBundle) {
  throw new Error('Could not find the finalized legacy polyfill bundle')
}

const appBundle = finalizedBundles.find(({ sourceName }) => sourceName.startsWith('index-legacy-'))
if (!appBundle) {
  throw new Error('Could not find the finalized legacy application bundle')
}

if (/<\/script/i.test(polyfillBundle.content)) {
  throw new Error('Legacy polyfill bundle cannot be safely embedded in HTML')
}

const namedRegisterSource = await readFile(namedRegisterPath, 'utf8')
parse(namedRegisterSource, { ecmaVersion: 5, sourceType: 'script' })

if (/<\/script/i.test(namedRegisterSource)) {
  throw new Error('SystemJS named-register extension cannot be safely embedded in HTML')
}

const anonymousRegisterCall = 'System.register(['
if (
  !appBundle.content.includes(anonymousRegisterCall)
  || appBundle.content.indexOf(anonymousRegisterCall) !== appBundle.content.lastIndexOf(anonymousRegisterCall)
) {
  throw new Error('Expected exactly one anonymous System.register application module')
}

const namedAppSource = appBundle.content.replace(
  anonymousRegisterCall,
  `System.register("${appModuleId}",[`,
)
parse(namedAppSource, { ecmaVersion: 5, sourceType: 'script' })

if (/<\/script/i.test(namedAppSource)) {
  throw new Error('Legacy application bundle cannot be safely embedded in HTML')
}

const polyfillTag = `<script crossorigin id="vite-legacy-polyfill" src="/assets/${polyfillBundle.finalName}"></script>`
if (!html.includes(polyfillTag)) {
  throw new Error('Could not find the generated legacy polyfill tag')
}

html = html.replace(
  polyfillTag,
  () => `<script id="telegram-systemjs-loader">${systemJsSource}</script>\n    <script id="vite-legacy-polyfill">${polyfillBundle.content}</script>`,
)

const entryTag = `<script crossorigin id="vite-legacy-entry" data-src="/assets/${appBundle.finalName}">System.import(document.getElementById('vite-legacy-entry').getAttribute('data-src'))</script>`
if (!html.includes(entryTag)) {
  throw new Error('Could not find the generated legacy application tag')
}

html = html.replace(
  entryTag,
  () => `<script id="telegram-systemjs-named-register">${namedRegisterSource}</script>\n    <script id="vite-legacy-entry">${namedAppSource}</script>\n    <script id="telegram-app-start">System.import("${appModuleId}")</script>`,
)

await writeFile(htmlPath, html, 'utf8')

console.log(
  `Finalized ES5 Telegram bundles: ${finalizedBundles.map(({ finalName }) => finalName).join(', ')}`,
)
