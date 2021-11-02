export interface NotionTextElement {
  rich_text: Array<{ type: "text"; text: { content: string } }>;
}

export interface NotionNumberElement {
  number: number;
}

export interface NotionBooleanElement {
  checkbox: boolean;
}

export interface NotionSelectElement<T> {
  select: { name: T } | null;
}

export interface NotionDateElement {
  date: { start: string } | null;
}

export interface NotionFormulaElement {
  formula: NotionNumberElement;
}
