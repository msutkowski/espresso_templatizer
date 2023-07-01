import espresso/html.{Element, a, c, t, txt}

pub fn simple() -> Element {
  t("div")
  |> c([
    t("span")
    |> c([
      t("div")
      |> a("class", "text-black")
      |> c([txt("Text here")]),
    ]),
  ])
}
