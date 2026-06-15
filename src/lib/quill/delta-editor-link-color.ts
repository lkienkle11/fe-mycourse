import type Quill from "quill";

/** Palette for hyperlink text color (toolbar picker + Quill whitelist). */
export const LINK_COLOR_PALETTE = [
  "#3dcbb1",
  "#2563eb",
  "#dc2626",
  "#ca8a04",
  "#16a34a",
  "#9333ea",
  "#000000",
] as const;

export const LINK_COLOR_FORMAT = "linkColor" as const;

/** Toolbar icon: chain link + color bar (distinct from generic text-color "A"). */
const LINK_COLOR_PICKER_ICON = `<svg viewBox="0 0 18 18">
  <path class="ql-stroke" d="M7.5 7.5h-2a3.5 3.5 0 0 0 0 7h2"></path>
  <path class="ql-stroke" d="M10.5 10.5h2a3.5 3.5 0 0 0 0-7h-2"></path>
  <line class="ql-color-label ql-stroke ql-transparent" x1="3" x2="15" y1="16" y2="16"></line>
</svg>`;

let linkColorFormatRegistered = false;

type QuillConstructor = typeof Quill;

export function registerLinkColorFormat(QuillCtor: QuillConstructor): void {
  if (linkColorFormatRegistered) {
    return;
  }

  const Parchment = QuillCtor.import("parchment") as {
    Attributor: {
      Style: new (
        attrName: string,
        styleName: string,
        options: { scope: unknown; whitelist: string[] },
      ) => unknown;
    };
    Scope: { INLINE: unknown };
  };

  const linkColorStyle = new Parchment.Attributor.Style(
    LINK_COLOR_FORMAT,
    "color",
    {
      scope: Parchment.Scope.INLINE,
      whitelist: [...LINK_COLOR_PALETTE],
    },
  );

  QuillCtor.register(
    linkColorStyle as Parameters<QuillConstructor["register"]>[0],
    true,
  );
  linkColorFormatRegistered = true;
}

function selectionHasLink(
  quill: Quill,
  range: { index: number; length: number },
): boolean {
  if (range.length === 0) {
    return typeof quill.getFormat(range.index, 1).link === "string";
  }
  return typeof quill.getFormat(range.index, range.length).link === "string";
}

function enhanceLinkColorPicker(quill: Quill, pickerTitle: string): void {
  const toolbar = quill.getModule("toolbar") as
    | { container: HTMLElement }
    | undefined;
  if (!toolbar) {
    return;
  }

  const select = toolbar.container.querySelector("select.ql-linkColor");
  const existingColorPicker = toolbar.container.querySelector(
    ".ql-linkColor.ql-picker.ql-color-picker",
  );
  if (existingColorPicker) {
    return;
  }

  // Snow theme builds a generic dropdown picker first; remove it so ColorPicker
  // can replace the hidden <select> with a visible 28px color swatch control.
  for (const picker of toolbar.container.querySelectorAll(
    ".ql-linkColor.ql-picker",
  )) {
    picker.remove();
  }

  if (!(select instanceof HTMLSelectElement)) {
    return;
  }
  if (select.dataset.enhanced === "true") {
    return;
  }
  select.dataset.enhanced = "true";
  select.style.display = "";

  const QuillCtor = quill.constructor as typeof Quill;
  const ColorPicker = QuillCtor.import("ui/color-picker") as new (
    select: HTMLSelectElement,
    label: string,
  ) => unknown;
  new ColorPicker(select, LINK_COLOR_PICKER_ICON);

  const picker = toolbar.container.querySelector(
    ".ql-linkColor.ql-picker.ql-color-picker",
  );
  if (picker instanceof HTMLElement) {
    picker.title = pickerTitle;
    picker.setAttribute("aria-label", pickerTitle);
    const label = picker.querySelector(".ql-picker-label");
    if (label instanceof HTMLElement) {
      label.title = pickerTitle;
      label.setAttribute("aria-label", pickerTitle);
    }
  }
}

export function bindQuillLinkColorHandler(
  quill: Quill,
  onNoLinkSelection: () => void,
  pickerTitle: string,
): () => void {
  const toolbar = quill.getModule("toolbar") as
    | {
        addHandler: (
          name: string,
          handler: (value: string | false) => void,
        ) => void;
        container: HTMLElement;
      }
    | undefined;

  const applyLinkColor = (value: string | false) => {
    const range = quill.getSelection(true);
    if (!range || range.length === 0 || !selectionHasLink(quill, range)) {
      onNoLinkSelection();
      return;
    }
    quill.format(LINK_COLOR_FORMAT, value || false, "user");
  };

  toolbar?.addHandler(LINK_COLOR_FORMAT, applyLinkColor);
  enhanceLinkColorPicker(quill, pickerTitle);

  return () => {};
}
