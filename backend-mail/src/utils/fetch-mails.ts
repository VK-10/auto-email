import Imap from "node-imap";

export function fetchEmails(imap: Imap, sinceDays = 30, uidSince? : number) {
    return new Promise<any[]> (( resolve, reject) => {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - sinceDays);
        const formattedDate = sinceDate.toUTCString().split(" ").slice(1, 4).join("-");

        const searchCriteria = uidSince
        ? ["UID", `${uidSince + 1}:*`]
        : ["ALL", ["SINCE", formattedDate]];

        imap.search(searchCriteria, (err,results)=> {
            if (err) return reject(err);
            if(!results || results.length === 0) return resolve([])
            
            const mails : any[] = [];
            const f = imap.fetch(results, { bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)", struct: true  });

            f.on("message", (msg)=>{
                let headers = "";
                let uid = 0;

                msg.on("attributes", (attrs)=> (uid = attrs.uid));
                msg.on("body", (stream)=>{
                    stream.on("data", (chunk)=> (headers += chunk.toString("utf8")));
                });

                msg.once("end", ()=>{
                    const parsed = Imap.parseHeader(headers);
                    mails.push({
                        uid,
                        from: parsed.from?.[0] || "",
                        to: parsed.to?.[0] || "",
                        subject: parsed.subject?.[0] || "(No subject)",
                        date: parsed.date ? new Date(parsed.date[0]).toISOString() : new Date().toISOString(),
                        folder: "INBOX",
                    });
                });
            });

            f.once("end", ()=> resolve(mails));
            f.once("error", reject);
         });
    });
}