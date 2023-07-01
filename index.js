import { parse } from "node-html-parser";
import chokidar from "chokidar";
import fs from "fs";
import { spawn } from "child_process";
import path from "path";

function traverseDOM(node) {
  if (node.nodeType === 3) {
    // Text node
    return {
      type: "text",
      content: node.textContent.trim(),
    };
  } else if (node.nodeType === 1) {
    // Element node
    const element = {
      type: "element",
      tag_name: node.tagName?.toLowerCase() || "div",
      attributes: getAttributes(node),
      children: [],
    };

    // Loop over child nodes
    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i];

      // Recursively call the function for child nodes
      const childElement = traverseDOM(childNode);

      // Add the child Element object to the children array
      element.children.push(childElement);
    }

    return element;
  } else {
    // Other node types (e.g., comment nodes, etc.)
    return null;
  }
}

function getAttributes(node) {
  return Object.entries(node.attributes).map(([key, value]) => ({
    name: key,
    value,
  }));
}

function toGleam(obj) {
  if (obj.type === "element") {
    let code = `t("${obj.tag_name}")`;

    if (obj.attributes.length > 0) {
      for (const attr of obj.attributes) {
        code += ` |> a("${attr.name}", "${attr.value}")`;
      }
    }

    const children = obj.children.map((child) => toGleam(child));
    if (children.length > 0) {
      code += ` |> c([${children.filter((f) => f !== 'txt("")').join(", ")}])`;
    }

    return code;
  } else if (obj.type === "text") {
    return `txt("${obj.content}")`;
  } else {
    return "";
  }
}

function filename(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function format(filePath, code) {
  const child = spawn("gleam", ["format", "--stdin"]);

  child.stdin.write(code);
  child.stdin.end();
  child.stdout.on("data", function (data) {
    const dir = path.dirname(filePath);
    const baseFileName = filename(filePath);

    fs.writeFile(`${dir}/${baseFileName}.gleam`, data, function (err) {
      if (err) console.log(err);
    });
  });
  child.stderr.on("data", function (error) {
    console.log(error);
  });
  child.on("error", (e) => console.log(e));
}

function processFile(filePath) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) throw err;

    const parsedDom = traverseDOM(parse(data));
    const gleamCode = toGleam(parsedDom);

    format(
      filePath,
      `
    import espresso/html.{Element, a, c, t, txt}

    pub fn ${filename(filePath)}() -> Element {
      ${gleamCode}
    }
    `
    );
  });
}

chokidar.watch("./**/*.gleahp").on("change", (path) => {
  processFile(path);
});
