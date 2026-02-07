import fetch from "node-fetch";
import { randomUUID } from 'node:crypto';

import { insertMagazine, insertPage } from "../utils/db";
import { Page, Magazine } from "../types/DiscountTypes";
import { savePageImage } from "../utils/Temp";
import { url } from "node:inspector";

async function imageUrlToBase64(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch image");
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

async function pageUrlToText(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch HTML page: ${response.status}`);
  }

  return await response.text();
}


function findImageUrls(html: string): string[] {
  const pattern = /https:\/\/www\.raskakcija\.lt\/admin\/contentfiles\/\d+\.jpg/g;
  const matches = html.match(pattern);
  return matches || [];
}

async function extractPagesFromMagazine(Url: string) {
  const htmlRawText = await pageUrlToText(Url);
  const imageUrls = findImageUrls(htmlRawText);

  const curMagazine: Magazine = {
    AddedTime: new Date(),
    URL: Url,
  }

  const magazineId = Number(insertMagazine(curMagazine));


  for (let index = 0; index < imageUrls.length; index++) {
    const element = imageUrls[index];
    const ImageUUID = randomUUID();

    savePageImage(
      ImageUUID,
      await imageUrlToBase64(element)
    );

    const curPage: Page = {
      Parsed: false,
      AddedTime: new Date(),
      ImageUUID: ImageUUID,
      MagazineId: magazineId,
    }

    insertPage(curPage);
  }
}

export async function findAllCurrentMagazines() {
  //TODO
}