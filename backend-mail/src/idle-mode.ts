// src/idle.ts
import Imap from "node-imap";
import { getAccessToken } from "./oauth.ts";
import dotenv from "dotenv";
import { EventEmitter } from "events";
import { indexEmail } from "./elastic-index.ts";
import { fetchEmails } from "./utils/fetch-mails.ts";

dotenv.config();

// Event emitter to push new emails to frontend
export const mailEmitter = new EventEmitter();

let lastUID: number = 0; // track last fetched UID

export async function startIdleConnection() {
  const accessToken = await getAccessToken();

  const xoauth2 = Buffer.from(
    `user=${process.env.GMAIL_USER}\u0001auth=Bearer ${accessToken}\u0001\u0001`
  ).toString("base64");

  const imap = new Imap({
    user: process.env.GMAIL_USER || "",
    xoauth2,
    password: process.env.GMAIL_PASSWORD || "",
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 30000,
  });

  // Open INBOX and fetch last 30 days initially
  imap.once("ready", () =>{
    imap.openBox("INBOX", true, async (err) => {
      if (err) throw err;

      console.log(" -----INBOX opened ------");

      // Initial fetch
      const initialEmails = await fetchEmails(imap, 30);
      for (const email of initialEmails) {
        mailEmitter.emit("email", email);
        await indexEmail(email);
        if (email.uid > lastUID) lastUID = email.uid;
      };

      //watching for new mails
      imap.on("mail",async (numNewMsgs) => {
        console.log(`---${numNewMsgs} new email(s) arrived----`);
        const newEmails = await fetchEmails(imap, 30, lastUID);
        for (const email of newEmails) {
          mailEmitter.emit("email", email);
          await indexEmail(email);
          if (email.uid > lastUID) lastUID = email.uid;
        }
      });
    });
  });

 

  // // Fetch only new emails using lastUID
  // async function fetchNewEmails() {
  //   if (!lastUID) return;

  //   imap.search(["UID", `${lastUID + 1}:*`], (err, results) => {
  //     if (err) throw err;
  //     if (!results || !results.length) return;

  //     const f = imap.fetch(results, { bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)", struct: true });

  //     f.on("message", (msg) => {
  //       let headers = "";
  //       let uid = 0;

  //       msg.on("attributes", (attrs) => {
  //         uid = attrs.uid;
  //       });

  //       msg.on("body", (stream) => {
  //         stream.on("data", (chunk) => (headers += chunk.toString("utf8")));
  //       });

  //       msg.once("end", async () => {
  //         const parsed = Imap.parseHeader(headers);
  //         const email = {
  //           uid,
  //           from : parsed.from?.[0] || "",
  //           to: parsed.to?.[0] || "",
  //           subject: parsed.subject?.[0] || "(No subject)",
  //           date: parsed.date ? new Date(parsed.date[0]).toISOString() : new Date().toISOString(),
  //           folder: "INBOX",
  //           account : process.env.GMAIL_USER || "default",
  //         };
  //         mailEmitter.emit("email", email);
  //         await indexEmail(email);
  //         if (uid > lastUID) lastUID = uid;
  //       });
  //     });

      

  //     f.once("end", () => console.log(" Fetched new emails"));
  //   });
  // }

  // // Connection events
  // imap.once("ready", openInbox);





  imap.once("error", (err) => console.error("IMAP error:", err));
  imap.once("end", () => {
    console.log("IMAP connection ended, reconnecting...");
    setTimeout(() => startIdleConnection(), 5000); // reconnect after 5s
  });

  imap.connect();
}
