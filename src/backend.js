const fs = require("fs");
const path = require("path");

const routes = {
  "/": (req, res, data) => `Routes: ${Object.keys(routes)}`,
  "/up": (req, res, data) => {
    return "ok";
  },
  "/build.js": (req, res, data) => {
    res.setHeader("Content-Type", "application/javascript");
    const script = fs.readFileSync(path.join(__dirname, "build.js"), "utf8");
    return script.replace(
      "<<<SERVER>>>",
      `${req.protocol}://${req.headers.host}`
    );
  },
  "/save": (req, res, data) => {
    const { location, content } = data;
    const validatedContent = JSON.stringify(JSON.parse(content));
    const target = path.join(process.cwd(), path.resolve("/", location));
    fs.writeFileSync(target, validatedContent);
  },
};

frameworkify(7007, routes);

function frameworkify(PORT, routes) {
  const fixPath = /\/$/;
  const http = require("http");
  const server = http.createServer(async (req, res) => {
    try {
      const { searchParams, pathname } = new URL(req.url, `http://localhost/`);
      const data = Object.fromEntries(searchParams.entries());
      const handler = routes[pathname.replace(fixPath, "")] || routes["/"];
      const result = await handler(req, res, data);
      res.statusCode = 200;
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
    console.log(res.statusCode, req.url);
  });
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
  server.on("error", (err) => {
    console.error(err);
  });
}
