import Imap from "node-imap";
import { inspect } from "util";
import { getAccessToken } from "./oauth.ts";
import dotenv from 'dotenv';

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

    const mails : any[] = [];
 
    imap.once("ready", () => {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 30);

      imap.openBox("INBOX", true, (err, box) => {
        if (err) return reject(err);

        const searchCriteria = [["SINCE", sinceDate.toISOString().slice(0, 16)]];
        imap.search(searchCriteria, (err, results) => {
          if (err) return reject(err);

          if (!results || results.length === 0) {
            console.log("No recent mails found.");
            imap.end();
            return resolve([]);
          }

          const f = imap.fetch(results, { bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)", struct: true });
          f.on("message", (msg, seqno) => {
            const mail : any = {};
            msg.on("body", (stream) => {
              let buffer = "";
              stream.on("data", (chunk) => (buffer += chunk.toString("utf8")));
              stream.once("end", () => {
                // console.log(`[${seqno}] ${inspect(Imap.parseHeader(buffer))}`);
                mail.header = Imap.parseHeader(buffer);
              });
            });
            msg.on("attributes", (attrs) => {
              mail.attrs = attrs;
            });
            msg.once("end", () => {
              mails.push(mail);
            })
          });

          f.once("end", () => {
            console.log("Done fetching last 30 days mails.");
            imap.end();
            resolve(mails);
          });
        });
      });
    });

    imap.once("error", reject);
    imap.connect();
  });
}
