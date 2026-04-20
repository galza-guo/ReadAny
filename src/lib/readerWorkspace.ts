export type ReaderPanelKey = "navigation" | "original" | "translation" | "chat";
export type ReaderColumnKey = "navigation" | "original" | "rail";
export type ReaderRailSectionKey = "translation" | "chat";

export type ReaderPanelsState = Record<ReaderPanelKey, boolean>;
export type ReaderColumnWeights = Partial<Record<ReaderColumnKey, number>>;
export type ReaderRailSectionWeights = Partial<Record<ReaderRailSectionKey, number>>;
export type ReaderColumnWeightsByLayout = Record<string, ReaderColumnWeights>;
export type ReaderRailSectionWeightsByLayout = Record<string, ReaderRailSectionWeights>;

export const READER_PANEL_ORDER: ReaderPanelKey[] = [
  "navigation",
  "original",
  "translation",
  "chat",
];

export const READER_COLUMN_ORDER: ReaderColumnKey[] = ["navigation", "original", "rail"];
export const READER_RAIL_SECTION_ORDER: ReaderRailSectionKey[] = ["translation", "chat"];

export const DEFAULT_READER_PANELS: ReaderPanelsState = {
  navigation: false,
  original: true,
  translation: true,
  chat: false,
};

export const READER_SPLIT_HANDLE_SIZE = 12;

export const READER_COLUMN_DEFAULT_WEIGHTS: Record<ReaderColumnKey, number> = {
  navigation: 260,
  original: 620,
  rail: 480,
};

export const READER_RAIL_SECTION_DEFAULT_WEIGHTS: Record<ReaderRailSectionKey, number> = {
  translation: 60,
  chat: 40,
};

export const READER_PANEL_MIN_WIDTHS: Record<ReaderPanelKey, number> = {
  navigation: 220,
  original: 360,
  translation: 320,
  chat: 280,
};

export const READER_PANEL_MIN_HEIGHTS: Record<ReaderPanelKey, number> = {
  navigation: 240,
  original: 240,
  translation: 220,
  chat: 180,
};

function getOrderedVisiblePanels(panels: ReaderPanelsState): ReaderPanelKey[] {
  return READER_PANEL_ORDER.filter((panel) => panels[panel]);
}

export function getVisibleReaderColumns(panels: ReaderPanelsState): ReaderColumnKey[] {
  const columns: ReaderColumnKey[] = [];

  if (panels.navigation) {
    columns.push("navigation");
  }

  if (panels.original) {
    columns.push("original");
  }

  if (panels.translation || panels.chat) {
    columns.push("rail");
  }

  return columns;
}

export function getVisibleRailSections(panels: ReaderPanelsState): ReaderRailSectionKey[] {
  return READER_RAIL_SECTION_ORDER.filter((section) => panels[section]);
}

export function ensureAtLeastOnePanelVisible(panels: ReaderPanelsState): ReaderPanelsState {
  if (getOrderedVisiblePanels(panels).length > 0) {
    return panels;
  }

  return {
    ...panels,
    original: true,
  };
}

export function toggleReaderPanel(
  panels: ReaderPanelsState,
  panel: ReaderPanelKey
): ReaderPanelsState {
  if (panels[panel] && getOrderedVisiblePanels(panels).length === 1) {
    return panels;
  }

  return ensureAtLeastOnePanelVisible({
    ...panels,
    [panel]: !panels[panel],
  });
}

export function getReaderColumnLayoutKey(columns: ReaderColumnKey[]): string {
  return columns.join(":");
}

export function getReaderRailLayoutKey(sections: ReaderRailSectionKey[]): string {
  return sections.join(":");
}

function resolveWeights<T extends string>({
  storedWeights,
  visibleKeys,
  defaultWeights,
  getLayoutKey,
}: {
  storedWeights: Record<string, Partial<Record<T, number>>>;
  visibleKeys: T[];
  defaultWeights: Record<T, number>;
  getLayoutKey: (keys: T[]) => string;
}): Partial<Record<T, number>> {
  const layoutKey = getLayoutKey(visibleKeys);
  const savedWeights = storedWeights[layoutKey];

  if (
    savedWeights &&
    visibleKeys.every((key) => typeof savedWeights[key] === "number" && (savedWeights[key] ?? 0) > 0)
  ) {
    return visibleKeys.reduce(
      (result, key) => ({
        ...result,
        [key]: savedWeights[key] ?? defaultWeights[key],
      }),
      {} as Partial<Record<T, number>>
    );
  }

  return visibleKeys.reduce(
    (result, key) => ({
      ...result,
      [key]: defaultWeights[key],
    }),
    {} as Partial<Record<T, number>>
  );
}

export function resolveReaderColumnWeights(
  storedWeights: ReaderColumnWeightsByLayout,
  visibleColumns: ReaderColumnKey[]
): ReaderColumnWeights {
  return resolveWeights({
    storedWeights,
    visibleKeys: visibleColumns,
    defaultWeights: READER_COLUMN_DEFAULT_WEIGHTS,
    getLayoutKey: getReaderColumnLayoutKey,
  });
}

export function resolveReaderRailSectionWeights(
  storedWeights: ReaderRailSectionWeightsByLayout,
  visibleSections: ReaderRailSectionKey[]
): ReaderRailSectionWeights {
  return resolveWeights({
    storedWeights,
    visibleKeys: visibleSections,
    defaultWeights: READER_RAIL_SECTION_DEFAULT_WEIGHTS,
    getLayoutKey: getReaderRailLayoutKey,
  });
}

export function getReaderRailMinWidth(panels: ReaderPanelsState): number {
  return getVisibleRailSections(panels).reduce(
    (maxWidth, section) => Math.max(maxWidth, READER_PANEL_MIN_WIDTHS[section]),
    0
  );
}

export function getReaderColumnMinWidth(
  column: ReaderColumnKey,
  panels: ReaderPanelsState
): number {
  if (column === "rail") {
    return getReaderRailMinWidth(panels);
  }

  return READER_PANEL_MIN_WIDTHS[column];
}

export function getReaderRailMinHeight(panels: ReaderPanelsState): number {
  const visibleSections = getVisibleRailSections(panels);

  if (visibleSections.length === 0) {
    return 0;
  }

  if (visibleSections.length === 1) {
    return READER_PANEL_MIN_HEIGHTS[visibleSections[0]];
  }

  return (
    visibleSections.reduce((total, section) => total + READER_PANEL_MIN_HEIGHTS[section], 0) +
    READER_SPLIT_HANDLE_SIZE
  );
}

function clampPairSizes({
  leadingSize,
  trailingSize,
  leadingMin,
  trailingMin,
  delta,
}: {
  leadingSize: number;
  trailingSize: number;
  leadingMin: number;
  trailingMin: number;
  delta: number;
}): { leadingSize: number; trailingSize: number } {
  const total = Math.max(0, leadingSize) + Math.max(0, trailingSize);
  const nextLeading = Math.max(
    leadingMin,
    Math.min(Math.max(0, leadingSize) + delta, total - trailingMin)
  );

  return {
    leadingSize: nextLeading,
    trailingSize: Math.max(trailingMin, total - nextLeading),
  };
}

export function clampReaderColumnPairSizes({
  panels,
  leftColumn,
  rightColumn,
  leftSize,
  rightSize,
  delta,
}: {
  panels: ReaderPanelsState;
  leftColumn: ReaderColumnKey;
  rightColumn: ReaderColumnKey;
  leftSize: number;
  rightSize: number;
  delta: number;
}): { leftSize: number; rightSize: number } {
  const result = clampPairSizes({
    leadingSize: leftSize,
    trailingSize: rightSize,
    leadingMin: getReaderColumnMinWidth(leftColumn, panels),
    trailingMin: getReaderColumnMinWidth(rightColumn, panels),
    delta,
  });

  return {
    leftSize: result.leadingSize,
    rightSize: result.trailingSize,
  };
}

export function clampReaderRailSectionPairSizes({
  topSection,
  bottomSection,
  topSize,
  bottomSize,
  delta,
}: {
  topSection: ReaderRailSectionKey;
  bottomSection: ReaderRailSectionKey;
  topSize: number;
  bottomSize: number;
  delta: number;
}): { topSize: number; bottomSize: number } {
  const result = clampPairSizes({
    leadingSize: topSize,
    trailingSize: bottomSize,
    leadingMin: READER_PANEL_MIN_HEIGHTS[topSection],
    trailingMin: READER_PANEL_MIN_HEIGHTS[bottomSection],
    delta,
  });

  return {
    topSize: result.leadingSize,
    bottomSize: result.trailingSize,
  };
}

export function getReaderWorkspaceMinWidth(panels: ReaderPanelsState): number {
  const visibleColumns = getVisibleReaderColumns(panels);

  if (visibleColumns.length === 0) {
    return 0;
  }

  return (
    visibleColumns.reduce((total, column) => total + getReaderColumnMinWidth(column, panels), 0) +
    Math.max(0, visibleColumns.length - 1) * READER_SPLIT_HANDLE_SIZE
  );
}

export function getReaderWorkspaceMinHeight(panels: ReaderPanelsState): number {
  return Math.max(
    panels.navigation ? READER_PANEL_MIN_HEIGHTS.navigation : 0,
    panels.original ? READER_PANEL_MIN_HEIGHTS.original : 0,
    getReaderRailMinHeight(panels)
  );
}
