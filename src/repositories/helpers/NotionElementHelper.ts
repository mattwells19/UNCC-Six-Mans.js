import { DateTime } from "luxon";
import {
  NotionTextElement,
  NotionNumberElement,
  NotionBooleanElement,
  NotionSelectElement,
  NotionDateElement,
  NotionFormulaElement,
} from "./NotionTypes";

export default class NotionElementHelper {
  static notionTextElementFromText(value: string): NotionTextElement {
    return { rich_text: [{ text: { content: value }, type: "text" }] };
  }

  static notionNumberElementFromNumber(value: number): NotionNumberElement {
    return { number: value };
  }

  static notionBooleanElementFromBool(value: boolean): NotionBooleanElement {
    return { checkbox: value };
  }

  static notionSelectElementFromValue<T>(value?: T | null): NotionSelectElement<T> {
    return { select: value ? { name: value } : null };
  }

  static notionDateElementFromDateTime(value?: DateTime | null): NotionDateElement {
    return { date: value ? { start: value.toUTC().toISO() } : null };
  }

  static notionFormulaElementFromNumber(value: number): NotionFormulaElement {
    return { formula: { number: value } };
  }

  static textFromNotionTextElement(textElement: NotionTextElement): string {
    return textElement.rich_text[0].text.content;
  }

  static numberFromNotionNumberElement(numberElement: NotionNumberElement): number {
    return numberElement.number;
  }

  static boolFromNotionBooleanElement(booleanElement: NotionBooleanElement): boolean {
    return booleanElement.checkbox;
  }

  static valueFromNotionSelectElement<T>(selectElement: NotionSelectElement<T>): T | null {
    return selectElement.select?.name ?? null;
  }

  static dateTimeFromNotionDateElement(dateElement: NotionDateElement): DateTime | null {
    return dateElement.date ? DateTime.fromISO(dateElement.date.start, { locale: "America/New York" }) : null;
  }

  static numberFromNotionFormulaElement(formulaElement: NotionFormulaElement): number {
    // round to one decimal place for calculated values
    return +formulaElement.formula.number.toFixed(2);
  }
}
