import fs from 'node:fs/promises';
import path from 'node:path';

const baseDir = path.join(__dirname, "..", "..");
const tempFolder = path.join(baseDir, "temp");
const pagesImagesFolder = path.join(tempFolder, "PagesImages");

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
    createFolder(tempFolder, "PagesImages");
}

//Initialize folders
createMissingTempFolders();



//EXPORTS
export async function savePageImage(pageUUID: string, imageData: Buffer): Promise<string> {
    const filePath = path.join(pagesImagesFolder, `${pageUUID}.png`);
    await fs.writeFile(filePath, imageData);
    return filePath;
}

export async function getPageImage(pageUUID: string): Promise<Buffer> {
    const filePath = path.join(pagesImagesFolder, `${pageUUID}.png`);
    return await fs.readFile(filePath);
}

export async function removePageImage(pageUUID: string): Promise<void> {
    const filePath = path.join(pagesImagesFolder, `${pageUUID}.png`);
    try {
        await fs.unlink(filePath);
        console.log(`Deleted image: ${filePath}`);
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            console.log(`Image not found, nothing to delete: ${filePath}`);
        } else {
            console.error(`Error deleting image: ${err}`);
            throw err;
        }
    }
}
