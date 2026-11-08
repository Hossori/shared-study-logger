import { describe, expect, it } from "vitest";
import {
  isTextEntryElement,
  keyboardOverlapPx,
  shellFrame,
} from "../../src/react-app/app/shell/visualViewportFrame";

describe("keyboardOverlapPx", () => {
  it("is the gap below the visual viewport", () => {
    expect(keyboardOverlapPx(800, 500, 0)).toBe(300);
    expect(keyboardOverlapPx(800, 520, 40)).toBe(240);
  });

  it("is 0 when the visual viewport reaches the layout bottom", () => {
    expect(keyboardOverlapPx(800, 800, 0)).toBe(0);
    expect(keyboardOverlapPx(800, 820, 0)).toBe(0);
    expect(keyboardOverlapPx(800, null, 10)).toBe(0);
    expect(keyboardOverlapPx(800, 0, 10)).toBe(0);
  });
});

describe("shellFrame", () => {
  it("sets height on mount and orientation", () => {
    expect(
      shellFrame({
        visualHeight: 700,
        innerHeight: 800,
        scrollY: 0,
        textEntryFocused: false,
        widthDelta: null,
      }),
    ).toEqual({ heightPx: 700, resetScroll: false });
  });

  it("resets scroll when the window is offset and the keyboard is closed", () => {
    expect(
      shellFrame({
        visualHeight: 800,
        innerHeight: 800,
        scrollY: 12,
        textEntryFocused: false,
        widthDelta: 400,
      }).resetScroll,
    ).toBe(true);
  });

  it("does not move the shell while a text field is focused", () => {
    expect(
      shellFrame({
        visualHeight: 400,
        innerHeight: 800,
        scrollY: 20,
        textEntryFocused: true,
        widthDelta: null,
      }),
    ).toEqual({ heightPx: null, resetScroll: false });
  });

  it("does not shrink the shell for a keyboard-sized height change", () => {
    expect(
      shellFrame({
        visualHeight: 420,
        innerHeight: 800,
        scrollY: 0,
        textEntryFocused: false,
        widthDelta: 0,
      }),
    ).toEqual({ heightPx: null, resetScroll: false });
  });

  it("falls back to innerHeight when visual height is missing", () => {
    expect(
      shellFrame({
        visualHeight: null,
        innerHeight: 800,
        scrollY: 0,
        textEntryFocused: false,
        widthDelta: null,
      }).heightPx,
    ).toBe(800);
  });
});

describe("isTextEntryElement", () => {
  it("treats text inputs and textareas as text entry", () => {
    expect(isTextEntryElement("TEXTAREA", null, false)).toBe(true);
    expect(isTextEntryElement("INPUT", "text", false)).toBe(true);
    expect(isTextEntryElement("INPUT", null, false)).toBe(true);
    expect(isTextEntryElement("DIV", null, true)).toBe(true);
  });

  it("ignores buttons and checkboxes", () => {
    expect(isTextEntryElement("INPUT", "checkbox", false)).toBe(false);
    expect(isTextEntryElement("INPUT", "button", false)).toBe(false);
    expect(isTextEntryElement("BUTTON", null, false)).toBe(false);
  });
});
