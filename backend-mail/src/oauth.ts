import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentialsPath = path.join(__dirname, "../credentials.json");
const tokenPath = path.join(__dirname, "../token.json");

// Read credentials.json
const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

import { OAuth2Client } from "google-auth-library";
export const oAuth2Client = new OAuth2Client(
  client_id,
  client_secret,
  redirect_uris?.[0] || "urn:ietf:wg:oauth:2.0:oob"
);

// Load token if exists
if (fs.existsSync(tokenPath)) {
  const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  oAuth2Client.setCredentials(token);
}

// Get fresh access token
export async function getAccessToken(): Promise<string> {
  const res = await oAuth2Client.getAccessToken();
  if (!res.token) throw new Error("Failed to get access token");
  return res.token;
}
