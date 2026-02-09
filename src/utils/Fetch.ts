import fetch from "node-fetch";
import { v5 as uuidv5 } from 'uuid';

import { insertMagazine, insertPage } from "../utils/db";
import { Page, Magazine } from "../types/DiscountTypes";
import { savePageImage } from "../utils/Temp";

const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
export interface MagazineLink {
  url: string;
  title: string;
}


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

    savePageImage(
      ImageUUID,
      await imageUrlToBase64(element)
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

async function findAllCurrentMagazinesForAShop(ShopName: string) {
  const ShopUrl = await findUrlByShopName(ShopName);
  if (!ShopUrl) {
    console.error("Shop url was not found");
    return;
  }

  const HtmlRawData = await pageUrlToText(ShopUrl);

  const magazineLinks = findMagazineLinks(HtmlRawData);

  console.log(`Found ${magazineLinks.length} magazines for ${ShopName}`);

  for (const link of magazineLinks) {
    await extractPagesFromMagazine(link, ShopName);
  }
}


export async function updateDatabase() {
  findAllCurrentMagazinesForAShop("Maxima");
}