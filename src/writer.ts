export function withGleamTemplate(functionName: string, code: string) {
  return `
import espresso/html.{Element, a, c, t, txt}

pub fn ${functionName}() -> Element {
  ${code}
}
`;
}
