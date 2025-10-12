import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node: "http://localhost:9200",
});

// quick test
export async function testESConnection() {
  const info = await esClient.info();
  console.log("Connected to Elasticsearch:", info);
}

testESConnection()