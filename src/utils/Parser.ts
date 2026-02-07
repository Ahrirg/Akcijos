import { BlockLike, forEachChild } from "typescript";
import { getItemDiscountsFromImage } from "../managers/Ai"
// import { imageUrlToBase64, pageUrlToText } from "./Fetch";
import { url } from "node:inspector";
import * as fs from "node:fs";
import path from "node:path";


function addItemToDatabase(oneLine : string) : boolean {
    console.log("We would be adding data here data:" + oneLine);
    //TODO
    return true;
}

function addAllItems(parsedData: string) : boolean {
    const splitData = parsedData.split("\n");
    for (let index = 0; index < splitData.length; index++) {
        const element = splitData[index];
        const wegot = addItemToDatabase(element);
        if (wegot == false) {
            return false;
        }
    }
    return true;
}

function parseImageWithAi(base64Image: Buffer): Promise<string | undefined> {
    return getItemDiscountsFromImage(base64Image);
}

async function parseOnePage(imageUrl: string): Promise<boolean> {
    try {
        const imageDataBase64 = 0;

        console.log("Ai parse started");
        const parsedData = 0;
        console.log("Ai parse done\n");
        if (!parsedData) {
            console.error("AI returned no data");
            return false;
        }

        return addAllItems(parsedData);
    } catch (error) {
        console.error("Failed to parse page:", error);
        return false;
    }
}

function findRaskakcijaImageUrls(html: string): string[] {
  const pattern = /https:\/\/www\.raskakcija\.lt\/admin\/contentfiles\/\d+\.jpg/g;
  const matches = html.match(pattern);
  return matches || [];
}

// async function parseMagazine(pageUrl: string): Promise<boolean> {
//     try {
//         const pageData = 0;
//         const imageUrls = 0;

//         for (const url of imageUrls) {
//             await parseOnePage(url);
//         }

//         return true;
//     } catch (error) {
//         console.error("Failed to parse magazine:", error);
//         return false;
//     }
// }

// async function cronJob(): Promise<void> {
//     console.log("Cron Job");
//     await parseMagazine(
//         "https://www.raskakcija.lt/maxima-akciju-leidinys.htm"
//     );
//     console.log("Cron job completed!");
// }

async function cronJob(): Promise<void> {
    console.log("Cron Job");
    // await parseMagazine(
    //     "https://www.raskakcija.lt/maxima-akciju-leidinys.htm"
    // );
    try {
        const imageDataBase64 = fs.readFileSync(path.join(__dirname,"..", "..", "testing", "test.jpg"));

        console.log("Ai parse started");
        const parsedData = await parseImageWithAi(imageDataBase64);
        console.log("Ai parse done\n");
        if (!parsedData) {
            console.error("AI returned no data");
            return;
        }

        addAllItems(parsedData);
    } catch (error) {
        console.error("Failed to parse page:", error);
        return;
    }
    
    console.log("Cron job completed!");
}

cronJob().catch(console.error);