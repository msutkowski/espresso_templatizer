import { describe, expect, it } from "vitest";
import { withGleamTemplate } from "../writer";
import { toGleam, traverseDOM } from "../parser";
import parse from "node-html-parser";
import { simpleTestHtml } from "./common";

describe("withGleamTemplate", () => {
  it("wraps the code in a function", () => {
    const generatedCode = toGleam(traverseDOM(parse(simpleTestHtml)));

    expect(withGleamTemplate("sample", generatedCode)).toMatchSnapshot();
  });
});
