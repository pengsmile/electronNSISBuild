const { spawn } = require('child_process');
const argv = require('minimist')(process.argv.slice(2))._;
const fs = require('fs');
const path = require('path');
const config = require('../appInfo.json');

// 使用 path.join 确保路径在不同系统下都能正确解析
const winUnpackedPath = path.join(__dirname, 'FilesToInstall', 'win-unpacked');
const resourcesPath = path.join(winUnpackedPath, 'resources');
const distResourcesPath = path.resolve(__dirname, '..', 'dist', 'resources');

config.APPLICATION_SIZE = parseInt(geFileList(winUnpackedPath) / 1024 / 1024 + 1);
config.LANGUAGE_CODE = argv[0]?.toLowerCase() || 'cn';

let stdout = '';
for (const key in config) {
    stdout += `!define ${key} \"${config[key]}\"\n`;
}

fs.writeFileSync(path.join(__dirname, 'SetupScripts', 'config.nsh'), stdout);

pack();

// 读取文件信息
function geFileList(dirPath) {
    const filesList = [];
    readFile(dirPath, filesList);
    let totalSize = 0;
    for (let i = 0; i < filesList.length; i++) {
        const item = filesList[i];
        totalSize += item.size;
    }
    return totalSize;
}

function readFile(dirPath, filesList) {
    const files = fs.readdirSync(dirPath); // 修复：添加 const
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const states = fs.statSync(fullPath); // 修复：添加 const
        if (states.isDirectory()) {
            readFile(fullPath, filesList);
        } else {
            const obj = {
                size: states.size,
                name: file,
                path: fullPath
            };
            filesList.push(obj);
        }
    });
}

function pack() {
    // 修复：将 packHot 改为同步执行，确保拷贝完成后再执行后续打包
    packHot(resourcesPath, distResourcesPath);
    packExe();
}

// 运行打包程序
function packExe() {
    const bat = spawn('cmd.exe', ['/c', `cd ${__dirname} && start build.cmd`]);

    bat.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    bat.stderr.on('data', (data) => {
        console.error(data.toString());
    });

    bat.on('exit', (code) => {
        console.log(`Child exited with code ${code}`);
    });
}

// 修复：将 packHot 改为完全同步的方法，避免竞态问题
function packHot(prePath, nextPath) {
    if (!fs.existsSync(prePath)) return;
    if (!fs.existsSync(nextPath)) {
        fs.mkdirSync(nextPath, { recursive: true });
    }

    const files = fs.readdirSync(prePath);
    for (const file of files) {
        const dirPath = path.resolve(prePath, file);
        const destPath = path.resolve(nextPath, file);
        const stat = fs.statSync(dirPath);

        if (stat.isFile()) {
            fs.copyFileSync(dirPath, destPath);
        } else if (stat.isDirectory()) {
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            packHot(dirPath, destPath);
        }
    }
}
