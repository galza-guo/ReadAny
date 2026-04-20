import { describe, expect, test } from "bun:test";
import {
  DEFAULT_READER_PANELS,
  READER_SPLIT_HANDLE_SIZE,
  clampReaderColumnPairSizes,
  clampReaderRailSectionPairSizes,
  getReaderColumnLayoutKey,
  getReaderWorkspaceMinHeight,
  getReaderWorkspaceMinWidth,
  getVisibleRailSections,
  getVisibleReaderColumns,
  resolveReaderColumnWeights,
  resolveReaderRailSectionWeights,
  toggleReaderPanel,
  type ReaderPanelsState,
} from "./readerWorkspace";

describe("toggleReaderPanel", () => {
  test("turns a hidden panel on", () => {
    expect(toggleReaderPanel(DEFAULT_READER_PANELS, "navigation")).toEqual({
      navigation: true,
      original: true,
      translation: true,
      chat: false,
    });
  });

  test("keeps the last visible panel on", () => {
    const translationOnly: ReaderPanelsState = {
      navigation: false,
      original: false,
      translation: true,
      chat: false,
    };

    expect(toggleReaderPanel(translationOnly, "translation")).toEqual(translationOnly);
  });
});

describe("visible layout helpers", () => {
  test("treats translation or chat as the shared right rail", () => {
    expect(
      getVisibleReaderColumns({
        navigation: true,
        original: true,
        translation: false,
        chat: true,
      })
    ).toEqual(["navigation", "original", "rail"]);
  });

  test("returns only visible rail sections in stable order", () => {
    expect(
      getVisibleRailSections({
        navigation: false,
        original: true,
        translation: true,
        chat: true,
      })
    ).toEqual(["translation", "chat"]);
  });
});

describe("resolveReaderColumnWeights", () => {
  test("uses default weights for the current visible column set", () => {
    expect(resolveReaderColumnWeights({}, ["original", "rail"])).toEqual({
      original: 620,
      rail: 480,
    });
  });

  test("remembers weights separately for each visible column set", () => {
    expect(
      resolveReaderColumnWeights(
        {
          [getReaderColumnLayoutKey(["original", "rail"])]: {
            original: 700,
            rail: 360,
          },
        },
        ["navigation", "original", "rail"]
      )
    ).toEqual({
      navigation: 260,
      original: 620,
      rail: 480,
    });
  });
});

describe("resolveReaderRailSectionWeights", () => {
  test("defaults to a 60/40 translation-chat split", () => {
    expect(resolveReaderRailSectionWeights({}, ["translation", "chat"])).toEqual({
      translation: 60,
      chat: 40,
    });
  });

  test("restores a saved rail split", () => {
    expect(
      resolveReaderRailSectionWeights(
        {
          "translation:chat": {
            translation: 55,
            chat: 45,
          },
        },
        ["translation", "chat"]
      )
    ).toEqual({
      translation: 55,
      chat: 45,
    });
  });
});

describe("clampReaderColumnPairSizes", () => {
  test("keeps the right rail above the translation minimum width", () => {
    expect(
      clampReaderColumnPairSizes({
        panels: {
          navigation: false,
          original: true,
          translation: true,
          chat: false,
        },
        leftColumn: "original",
        rightColumn: "rail",
        leftSize: 600,
        rightSize: 400,
        delta: 200,
      })
    ).toEqual({
      leftSize: 680,
      rightSize: 320,
    });
  });

  test("lets the rail shrink further when only chat is visible", () => {
    expect(
      clampReaderColumnPairSizes({
        panels: {
          navigation: false,
          original: true,
          translation: false,
          chat: true,
        },
        leftColumn: "original",
        rightColumn: "rail",
        leftSize: 600,
        rightSize: 320,
        delta: 200,
      })
    ).toEqual({
      leftSize: 640,
      rightSize: 280,
    });
  });
});

describe("clampReaderRailSectionPairSizes", () => {
  test("keeps both stacked rail sections above their minimum heights", () => {
    expect(
      clampReaderRailSectionPairSizes({
        topSection: "translation",
        bottomSection: "chat",
        topSize: 360,
        bottomSize: 240,
        delta: 120,
      })
    ).toEqual({
      topSize: 420,
      bottomSize: 180,
    });
  });
});

describe("workspace minimum sizes", () => {
  test("adds visible column minimum widths and splitter widths", () => {
    expect(
      getReaderWorkspaceMinWidth({
        navigation: true,
        original: true,
        translation: true,
        chat: true,
      })
    ).toBe(220 + 360 + 320 + READER_SPLIT_HANDLE_SIZE * 2);
  });

  test("uses the stacked rail when computing minimum workspace height", () => {
    expect(
      getReaderWorkspaceMinHeight({
        navigation: true,
        original: true,
        translation: true,
        chat: true,
      })
    ).toBe(220 + 180 + READER_SPLIT_HANDLE_SIZE);
  });
});
