const fs = require("fs");
const path = require("path");

const routes = {
  "/build.js": (req, res, qs) => {
    res.setHeader("Content-Type", "application/javascript");
    const script = fs.readFileSync(path.join(__dirname, "build.js"), "utf8");
    return script.replace(
      "<<<SERVER>>>",
      `http://${req.headers.host}/`
    );
  },
  "/save": (req, res, qs) => {
    const { location, content } = qs;
    // const validatedContent = JSON.stringify(JSON.parse(content));
    const target = path.join(process.cwd(), path.resolve("/", location));
    fs.writeFileSync(target, content);
  },
};

frameworkify(7007, routes);

function frameworkify(PORT, routes) {
  const fixPath = /\/$/;
  const http = require("http");
  const fallback = () => `Routes: ${Object.keys(routes)}`;
  const server = http.createServer(async (req, res) => {
    try {
      const { searchParams, pathname } = new URL(req.url, `http://localhost/`);
      const qs = Object.fromEntries(searchParams.entries());
      const handler = routes[pathname.replace(fixPath, "")] || fallback;
      const result = await handler(req, res, qs);
      res.statusCode = 200;
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (typeof result === "string") {
        res.end(result);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result));
      }
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err.message }));
    }
    console.log(res.statusCode, req.url.substring(0,20));
  });
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
  server.on("error", (err) => {
    console.error(err);
  });
}
