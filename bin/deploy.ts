import OSS from 'ali-oss'
import prompt from 'prompt'
import fs from 'fs'
import path from 'path'

const CONFIG_FILE_PATH = path.join(__dirname, '..', '.deploy.json')

interface DeployConfig {
    region?: string
    access_id?: string
    access_key?: string
    bucket?: string
}

async function promptConifg() {
    let config: DeployConfig = {}
    prompt.start({
        message: '请配置'
    })
    config = await prompt.get([
        { name: 'region', message: '区域', required: true },
        { name: 'access_id', message: 'Access Key ID', required: true },
        { name: 'access_key', message: 'Access Key Secret', required: true },
        { name: 'bucket', message: 'Bucket', required: true },
    ])
    if (config.region && !config.region.startsWith('oss-')) {
        config.region = 'oss-' + config.region;
    }
    await new Promise((resolve, reject) => {
        fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config), (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        })
    })
    return config;
}

async function loadConfig() {
    let config: DeployConfig = {}
    config = await new Promise((resolve, reject) => {
        fs.readFile(CONFIG_FILE_PATH, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data.toString('utf-8')));
            }
        })
    })
    return config;
}

const ROOT_DIST = path.join(__dirname, '..', 'dist')

interface DeployFileDef {
    relpath: string,
    abspath: string
}

async function fsStat(filepath: string): Promise<fs.Stats> {
    return await new Promise((resolve, reject) => {
        fs.stat(filepath, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result)
            }
        })
    })
}

async function listDeployFiles(directory: DeployFileDef): Promise<DeployFileDef[]> {
    let result: DeployFileDef[] = []
    const files: string[] = await new Promise((resolve, reject) => {
        fs.readdir(directory.abspath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files)
            }
        })
    })
    for (let filename of files) {
        const file: DeployFileDef = {
            relpath: path.join(directory.relpath, filename),
            abspath: path.join(directory.abspath, filename),
        }
        const stat = await fsStat(file.abspath)
        if (stat.isFile()) {
            result.push(file);
        } else if (stat.isDirectory()) {
            result = result.concat(await listDeployFiles(file));
        }
    }
    return result;
}

async function deploy() {
    const config = fs.existsSync(CONFIG_FILE_PATH) ? await loadConfig() : await promptConifg();
    const client = new OSS({
        region: config.region,
        accessKeyId: config.access_id || '',
        accessKeySecret: config.access_key || '',
        bucket: config.bucket,
    })
    const fileList = await client.list(null, {})
    for (let file of fileList.objects) {
        const result = await client.delete(file.name)
        console.log("Deleted file [" + file.name + "]")
    }
    
    for (let file of await listDeployFiles({ relpath: '', abspath: ROOT_DIST })) {
        const result = await client.put(file.relpath, file.abspath)
        console.log("Put file [" + file.relpath + "] (" + file.abspath + ")")
    }
}

deploy()



// const client = new OSS({
// })
