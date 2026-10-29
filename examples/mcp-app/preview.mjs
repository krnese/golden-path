import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { DIRECTORY, RESOURCE, TOOL, ARCHITECTURE_RESOURCE, READ_MODEL, UPDATE_MODEL, ENGINEERING_RESOURCE, INSPECT_SESSION, optionsFromArgs } from "./server.mjs";
import { inspectionInput } from "./engineering-schema.mjs";

export async function startPreview(target, port = 4328, state, session, engineering = false) {
  if (engineering && state) throw new Error("Choose either engineering inspection or the isolated architecture example.");
  const engineeringView = engineering || !!session;
  const client = new Client({ name: "golden-path-local-preview", version: "0.1.0" });
  await client.connect(new StdioClientTransport({
    command: process.execPath, args: [path.join(DIRECTORY, "server.mjs"), "--target", target, ...(state ? ["--state", state] : []), ...(session ? ["--session", session] : [])],
    stderr: "inherit",
  }));
  const server = http.createServer(async (req, res) => {
    const authority = `127.0.0.1:${server.address().port}`;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.headers.host !== authority ||
      (req.headers.origin && req.headers.origin !== `http://${authority}`)) {
      res.writeHead(403).end("Local preview origin required.");
      return;
    }
    try {
      if (req.method === "GET" && req.url === "/") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; connect-src 'self'; frame-ancestors 'none'");
        res.end(fs.readFileSync(path.join(DIRECTORY, "dist", "host.html"), "utf8")
          .replace("<!-- VIEW -->", engineeringView ? "engineering" : state ? "architecture" : "adoption"));
      } else if (req.method === "GET" && req.url === "/app") {
        const uri = engineeringView ? ENGINEERING_RESOURCE : state ? ARCHITECTURE_RESOURCE : RESOURCE;
        const resource = await client.readResource({ uri });
        const html = resource.contents.find((c) => c.uri === uri && typeof c.text === "string");
        if (!html) throw new Error("MCP server did not return the app resource.");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-ancestors 'self'");
        res.end(html.text);
      } else if (req.method === "POST" && req.url === "/report") {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(await client.callTool({ name: TOOL, arguments: {} })));
      } else if (engineeringView && req.method === "GET" && (req.url === "/engineering" || req.url.startsWith("/engineering?"))) {
        const query = new URL(req.url, `http://${authority}`).searchParams;
        const args = inspectionInput.parse(Object.fromEntries(query));
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(await client.callTool({ name: INSPECT_SESSION, arguments: args })));
      } else if (state && req.method === "GET" && req.url === "/model") {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(await client.callTool({ name: READ_MODEL, arguments: {} })));
      } else if (state && req.method === "POST" && req.url === "/model") {
        if (req.headers.origin !== `http://${authority}` || req.headers["content-type"] !== "application/json") {
          res.writeHead(403).end("Same-origin JSON required for draft updates.");
          return;
        }
        const chunks = [];
        let bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 128 * 1024) throw new Error("Draft update exceeds 128 KiB.");
          chunks.push(chunk);
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(await client.callTool({
          name: UPDATE_MODEL, arguments: JSON.parse(Buffer.concat(chunks).toString("utf8")),
        })));
      } else {
        res.writeHead(404).end("Not found");
      }
    } catch (error) {
      console.error(`Golden Path preview: ${error.message}`);
      res.writeHead(500, { "Content-Type": "text/plain" }).end(`Preview failed: ${error.message}`);
    }
  });
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", resolve);
    });
  } catch (error) {
    await client.close();
    throw error;
  }
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: async () => {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await client.close();
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: {
      target: { type: "string" }, state: { type: "string" }, session: { type: "string" }, engineering: { type: "boolean" },
    } });
    const args = ["target", "state", "session"].flatMap(key => values[key] ? [`--${key}`, values[key]] : []);
    const { target, state, session } = optionsFromArgs(args);
    const preview = await startPreview(target, 4328, state, session, values.engineering);
    console.log(`Golden Path MCP Apps preview: ${preview.url}`);
    for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
      preview.close().catch((error) => { console.error(error.message); process.exitCode = 1; });
    });
  } catch (error) {
    console.error(`Golden Path preview failed: ${error.message}`);
    process.exitCode = 1;
  }
}
