const ts = require("typescript")
const fs = require("fs")
const path = require("path")
const NativeModule = require("module")
const vm = require("vm")

// Compile using Typescript Compiler API
function runTypescript(filePath, cacheFilePath) {
    if (!cacheFilePath) {
        cacheFilePath = filePath.replace(/\.ts$/, '.capi.js')
    }
    if (!path.isAbsolute(filePath)) {
        filePath = path.join(__dirname, filePath)
    }
    filePath = path.normalize(filePath)
    const compiledFiles = {}
    const options = {
        allowJs: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES5,
        esModuleInterop: true
    }
    const host = ts.createCompilerHost(options)
    host.writeFile = (fileName, contents) => compiledFiles[fileName] = contents
    const program = ts.createProgram([filePath], options, host)
    program.emit()
    const jsContent = compiledFiles[filePath.replace(/\.ts$/, '.js')]
    if (!jsContent) {
        return undefined
    }
    if (!fs.existsSync(path.dirname(cacheFilePath))) {
        fs.mkdirSync(path.dirname(cacheFilePath), {
            recursive: true
        })
    }
    fs.writeFileSync(cacheFilePath, jsContent)
    const wrapper = NativeModule.wrap(jsContent)
    const relFilePath = path.relative(__dirname, cacheFilePath)
    const script = new vm.Script(wrapper, {
        filename: cacheFilePath,
        displayErrors: true
    })
    const result = script.runInThisContext()
    const mod = { exports: {} }
    result.call(mod.exports, mod.exports, require, mod, cacheFilePath, __dirname)
    return mod
}

runTypescript(
    path.join(__dirname, 'deploy.ts'),
    path.join(__dirname, '_cache', 'deploy.compiler_api.js')
    )