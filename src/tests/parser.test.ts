import { describe, expect, test } from "vitest";
import parse from "node-html-parser";
import { toGleam, traverseDOM } from "../parser";
import { simpleTestHtml } from "./common";

describe("traverseDOM", () => {
  test("generates an internal representation for gleam node output", () => {
    const parsedDom = parse(simpleTestHtml);
    expect(traverseDOM(parsedDom)).toMatchSnapshot();
  });
});

describe("toGleam", () => {
  test("converts GleamableNodes into gleam code", () => {
    const gleamableNodes = traverseDOM(parse(simpleTestHtml));
    expect(toGleam(gleamableNodes)).toMatchSnapshot();
  });
});
