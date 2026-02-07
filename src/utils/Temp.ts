import { create } from 'node:domain';
import fs from 'node:fs/promises';
import path from 'node:path';

async function createFolder(basePath:string, folderName: string) {
    const folderPath = path.join(basePath, folderName);

    try {
        await fs.mkdir(folderPath, { recursive: true });
        console.log(`Folder ${folderPath} created`)
    } catch (err) {
        console.log(`There was error creating: ${folderPath}, error: ${err}`)
    }
}

async function createMissingTempFolders() {
    const baseDir = path.join(__dirname, "..", "..");
    const tempFolder = path.join(baseDir, "temp");

    createFolder(tempFolder, "PagesImages");
}

createMissingTempFolders();