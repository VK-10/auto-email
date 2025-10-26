import Imap from "node-imap";

export function fetchEmails(imap: Imap, sinceDays = 30, uidSince?: number) {
    return new Promise<any[]>((resolve, reject) => {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - sinceDays);
        const formattedDate = sinceDate.toUTCString().split(" ").slice(1, 4).join("-");

        // ✅ FIXED: Proper IMAP search criteria format
        let searchCriteria: any[];
        
        if (uidSince) {
            // For incremental fetches (new emails only)
            searchCriteria = [['UID', `${uidSince + 1}:*`]];
        } else {
            // For initial fetch (all emails from last X days)
            searchCriteria = [['SINCE', formattedDate]];
        }

        imap.search(searchCriteria, (err, results) => {
            if (err) return reject(err);
            if (!results || results.length === 0) {
                console.log(`  ℹ️  No ${uidSince ? 'new' : 'matching'} emails found`);
                return resolve([]);
            }
            
            console.log(`  📬 Found ${results.length} email(s) to fetch`);
            
            const mails: any[] = [];
            const f = imap.fetch(results, { 
                bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)", 
                struct: true  
            });

            f.on("message", (msg) => {
                let headers = "";
                let uid = 0;

                msg.on("attributes", (attrs) => (uid = attrs.uid));
                msg.on("body", (stream) => {
                    stream.on("data", (chunk) => (headers += chunk.toString("utf8")));
                });

                msg.once("end", () => {
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

            f.once("end", () => {
                console.log(`  ✅ Successfully fetched ${mails.length} email(s)`);
                resolve(mails);
            });
            f.once("error", reject);
        });
    });
}