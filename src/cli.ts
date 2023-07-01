import { parse } from "node-html-parser";
import chokidar from "chokidar";
import fs from "fs";
import { spawn } from "child_process";
import path from "path";
import { toGleam, traverseDOM } from "./parser";
import { withGleamTemplate } from "./writer";
import { cli, command } from "cleye";
import { version } from "../package.json";

const argv = cli({
  name: "espresso_templatizer.js",
  version,
  commands: [
    command({
      name: "watch",
      flags: {
        dir: {
          type: String,
          description: "What directory should we watch?",
          default: "./**/",
        },
        format: {
          type: Boolean,
          description: "Should we run gleam format on the generated code?",
          default: true,
        },
      },
    }),
    command({
      name: "convert",
      parameters: ["<filenames...>"],
      flags: {
        format: {
          type: Boolean,
          description: "Should we run gleam format on the generated code?",
          default: true,
        },
      },
    }),
  ],
});

function getBaseFilename(filePath: string) {
  return path.basename(filePath, path.extname(filePath));
}

function asGleamPath(filePath: string) {
  return filePath.replace(".gleahp", ".gleam");
}

function format(filePaths: string[]) {
  // TODO: this should probably handle shell issues. If you don't have gleam in your path, this will fail silently.
  spawn("gleam", ["format", ...filePaths]);
}

export function processFile(filePath: string) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) throw err;

    const parsedDom = traverseDOM(parse(data));
    const gleamCode = toGleam(parsedDom);

    if (!gleamCode) {
      return console.log("No gleam code generated");
    }

    const targetFunctionName = getBaseFilename(filePath);
    const fileContents = withGleamTemplate(targetFunctionName, gleamCode);

    const dir = path.dirname(filePath);
    const baseFileName = getBaseFilename(filePath);

    fs.writeFile(`${dir}/${baseFileName}.gleam`, fileContents, function (err) {
      if (err) console.log(err);
    });
  });
}

if (argv.command === "watch") {
  const dir = argv.flags.dir;
  console.log("Watching for changes...", dir);
  chokidar.watch(`${dir}/*.gleahp`).on("change", (path) => {
    processFile(path);
    if (argv.flags.format) {
      console.log("formatting");
      format([asGleamPath(path)]);
    }
  });
}

if (argv.command === "convert") {
  argv._.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      return;
    }
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err}`);
      }

      console.log(`Converting file: ${filePath}`);
      processFile(filePath);
    });
  });

  if (argv.flags.format) {
    format(argv._.map((path) => asGleamPath(path)));
  }
}
