import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import process from "process";
import http from "http";
import open from "open";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentialsPath = path.join(__dirname, "../credentials.json");
const tokenPath = path.join(__dirname, "../token.json");

// Read and validate credentials
let credentials;
try {
  credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  if (!credentials.web) {
    throw new Error("Invalid credentials.json format. Expected 'web' configuration.");
  }
} catch (error) {
  console.error("Error reading credentials:", error);
  process.exit(1);
}

const { client_id, client_secret } = credentials.web;
const redirect_uri = "http://localhost:3000/oauth2callback";

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);

const SCOPES = ["https://mail.google.com/"];

async function main() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (req.url?.startsWith('/oauth2callback')) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const code = url.searchParams.get('code');
          if (code) {
            const { tokens } = await oAuth2Client.getToken(code);
            
            // Validate tokens
            if (!tokens.refresh_token) {
              throw new Error("No refresh token received. Please revoke access and try again.");
            }

            fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Authentication successful! You can close this window.</h1>');
            server.close();
            resolve(tokens);
          }
        }
      } catch (e) {
        console.error("Authentication error:", e);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Authentication failed: ${e}</h1>`);
        server.close();
        reject(e);
      }
    });

    server.listen(3000, () => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'  // Force consent screen to always get refresh token
      });
      console.log('Opening browser for authentication...');
      open(authUrl);
    });
  });
}

main()
  .then(() => {
    console.log("Token stored to", tokenPath);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });