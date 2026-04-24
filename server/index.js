import { createServer } from "node:http";
import { handleApiRequest, ensureLocalDataFiles } from "./core.mjs";

const port = Number.parseInt(process.env.PORT ?? process.env.LOCAL_API_PORT ?? "3001", 10);

await ensureLocalDataFiles();

const server = createServer((req, res) => {
  void handleApiRequest(req, res);
});

server.listen(port, () => {
  console.log(`JSON API listening on port ${port}`);
});
