import fetch from "node-fetch";
import { v5 as uuidv5 } from 'uuid';

import { insertMagazine, insertPage } from "../utils/db";
import { Page, Magazine } from "../types/DiscountTypes";
import { savePageImage } from "../utils/Temp";
import { readFile } from "fs/promises";

const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
export interface MagazineLink {
  url: string;
  title: string;
}

interface ShopData {
  name: string,
  url: string
}
interface ShopDataList {
  shops: Array<ShopData>
}


async function imageUrlToBase64(
  url: string,
  retries = 4
): Promise<Buffer | undefined> {

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      if (!response.ok) {
        console.error(
          `Image HTTP ${response.status}: ${url}`
        );
        return undefined;
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);

    } catch (err) {
      console.error(
        `Image download failed ${attempt}/${retries}: ${url}`,
        err instanceof Error ? err.message : err
      );

      if (attempt < retries) {
        await sleep(attempt * 2000);
      }
    }
  }

  console.error(`Giving up on image: ${url}`);
  return undefined;
}

async function pageUrlToText(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        },
        timeout: 15000
      } as any);

      if (!response.ok) {
        console.error(`HTTP ${response.status} for ${url}`);
        return "";
      }

      return await response.text();

    } catch (err) {
      console.error(
        `Fetch failed (${attempt}/${retries}) ${url}:`,
        err instanceof Error ? err.message : err
      );

      if (attempt < retries) {
        await sleep(2000 * attempt);
      }
    }
  }

  return "";
}


function extractEndDate(fullTitle: string): Date {
  const dateString: string = fullTitle.slice(-10);
  let date = new Date(dateString);
  date.setDate(date.getDate() + 1);

  if (isNaN(date.getTime())) {
    date = new Date();
    date.setDate(date.getDate() + 10);
  }

  return date;
}

function findImageUrls(html: string): string[] {
  const pattern = /https:\/\/www\.raskakcija\.lt\/admin\/contentfiles\/\d+\.jpg/g;
  const matches = html.match(pattern);
  return matches || [];
}

async function extractPagesFromMagazine(MagazineLink: MagazineLink, ShopName : string) {
  const htmlRawText = await pageUrlToText(MagazineLink.url);
  const imageUrls = findImageUrls(htmlRawText);

  const EndDate = extractEndDate(MagazineLink.title);

  const curMagazine: Magazine = {
    AddedTime: new Date(),
    URL: MagazineLink.url,
    Name: MagazineLink.title,
    EndTime: EndDate,
    ShopName: ShopName,
  }

  const magazineId = Number(insertMagazine(curMagazine));

  console.log({
    title: MagazineLink.title,
    url: MagazineLink.url,
    nrOfPages: imageUrls.length,
  })
  for (let index = 0; index < imageUrls.length; index++) {
    const element = imageUrls[index];
    const ImageUUID = uuidv5(`${MagazineLink.title}_page_${index}`, MY_NAMESPACE);

    const buffer = await imageUrlToBase64(element);
    if (!buffer) {
      continue;
    }

    savePageImage(
      ImageUUID,
      buffer
    );

    const curPage: Page = {
      Parsed: false,
      AddedTime: new Date(),
      ImageUUID: ImageUUID,
      MagazineId: magazineId,
      EndTime: EndDate,
    }

    insertPage(curPage);
  }
}

async function findUrlByShopName(ShopName: string) {
  if (ShopName === "Maxima") {
    return "https://www.raskakcija.lt/maxima-akcijos.htm";
  }
  if (ShopName === "Iki") {
    return "https://www.raskakcija.lt/iki-akcijos.htm";
  }
  if (ShopName === "Lidl") {
    return "https://www.raskakcija.lt/lidl-akcijos.htm;";
  }
   if (ShopName === "Rimi") {
    return "https://www.raskakcija.lt/rimi-akcijos.htm";
  }
  if (ShopName === "Cia") {
    return "https://www.raskakcija.lt/cia-akcijos.htm";
  }
}

function findMagazineLinks(html: string): MagazineLink[] {
  const pattern = /<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*class="[^"]*title green[^"]*"/g;
  const patternAlt = /<a[^>]*title="([^"]+)"[^>]*href="([^"]+)"[^>]*class="[^"]*title green[^"]*"/g;
  const patternThird = /<a[^>]*class="[^"]*title green[^"]*"[^>]*href="([^"]+)"[^>]*title="([^"]+)"/g;

  const matches = [
    ...html.matchAll(pattern),
    ...html.matchAll(patternAlt),
    ...html.matchAll(patternThird)
  ];

  const results = matches.map(match => {
    // If patternAlt matched, the order is [title, url], otherwise [url, title]
    const isAlt = match[0].indexOf('title="') < match[0].indexOf('href="');

    let url = isAlt ? match[2] : match[1];
    let title = isAlt ? match[1] : match[2];

    if (!url.startsWith('http')) {
      url = `https://www.raskakcija.lt${url.startsWith('/') ? '' : '/'}${url}`;
    }

    return { url, title };
  });

  return Array.from(new Map(results.map(item => [item.url, item])).values());
}

async function findAllCurrentMagazinesForAShop(ShopName: string, ShopUrl: string) {
  const HtmlRawData = await pageUrlToText(ShopUrl);

  const magazineLinks = findMagazineLinks(HtmlRawData);

  console.log(`Found ${magazineLinks.length} magazines for ${ShopName}`);

  for (const link of magazineLinks) {
    await extractPagesFromMagazine(link, ShopName);
  }
}

async function loadShopData(): Promise<ShopDataList> {
  const file = await readFile("./ShopMagazineLocations.json", "utf-8");
  return JSON.parse(file) as ShopDataList;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function updateDatabase() {
  const ShopData = await loadShopData();

  ShopData.shops.forEach(async element => {
    await findAllCurrentMagazinesForAShop(element.name, element.url);
    await sleep(1000);
  });

  // await findAllCurrentMagazinesForAShop("Maxima");
  // await findAllCurrentMagazinesForAShop("Iki");
  // await findAllCurrentMagazinesForAShop("Rimi");
  // await findAllCurrentMagazinesForAShop("Lidl");
  // await findAllCurrentMagazinesForAShop("Cia");
}