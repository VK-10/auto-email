import Imap from "node-imap";
import { inspect } from "util";
import { getAccessToken } from "./oauth.ts";
import dotenv from 'dotenv';
import { fetchEmails } from "./utils/fetch-mails.ts";

dotenv.config();

export async function fetchLast30DaysMails() {
  const accessToken = await getAccessToken();

  const xoauth2 = Buffer.from(
    `user=${process.env.GMAIL_USER}\u0001auth=Bearer ${accessToken}\u0001\u0001`
  ).toString("base64");

  

  const imap = new Imap({
    user: process.env.GMAIL_USER || '',
    xoauth2,
    password: process.env.GMAIL_PASSWORD || '',
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 30000,
  });

  return new Promise<any[]>((resolve, reject) => {
 
    imap.once("reday", async () => {
      imap.openBox("INBOX", true, async (err)=> {
        if (err) return reject(err);
        const mails = await fetchEmails(imap, 30);
        imap.end();
        resolve(mails);
      });
    });

    imap.once("error", reject);
    imap.connect();
  });
}
