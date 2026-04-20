import {
  getInitialPdfNavTab,
  getInitialPdfSidebarCollapsed,
  type PdfNavTab,
} from "./pdfNavigation";

export const PDF_NAV_TAB_KEY = "readany.pdfNav.tab";
export const PDF_NAV_COLLAPSED_KEY = "readany.pdfNav.collapsed";
export const PDF_NAV_SIDEBAR_WIDTH_KEY = "readany.pdfNav.sidebarWidth";
export const PDF_NAV_LEFT_PANE_WIDTH_KEY = "readany.pdfNav.leftPaneWidth";
export const PDF_NAV_RIGHT_PANE_WIDTH_KEY = "readany.pdfNav.rightPaneWidth";

export type PdfNavigationPrefs = {
  tab: PdfNavTab;
  collapsed: boolean;
  sidebarWidth: number;
  leftPaneWidth: number;
  rightPaneWidth: number;
};

const DEFAULT_PDF_NAV_PREFS: PdfNavigationPrefs = {
  tab: getInitialPdfNavTab(null),
  collapsed: getInitialPdfSidebarCollapsed(null),
  sidebarWidth: 252,
  leftPaneWidth: 0,
  rightPaneWidth: 0,
};

type WidthOptions = {
  allowZero?: boolean;
};

function getStoredWidth(
  storedValue: string | null,
  defaultValue: number,
  { allowZero = false }: WidthOptions = {}
) {
  if (storedValue == null) {
    return defaultValue;
  }

  if (storedValue.trim() === "") {
    return defaultValue;
  }

  const parsed = Number(storedValue);
  if (!Number.isInteger(parsed)) {
    return defaultValue;
  }

  if (parsed < 0 || (!allowZero && parsed === 0)) {
    return defaultValue;
  }

  return parsed;
}

function getStoredSidebarWidth(storedValue: string | null) {
  return getStoredWidth(storedValue, DEFAULT_PDF_NAV_PREFS.sidebarWidth);
}

function getStoredPaneWidth(storedValue: string | null) {
  return getStoredWidth(storedValue, DEFAULT_PDF_NAV_PREFS.leftPaneWidth, { allowZero: true });
}

export function loadPdfNavigationPrefs(): PdfNavigationPrefs {
  try {
    return {
      tab: getInitialPdfNavTab(localStorage.getItem(PDF_NAV_TAB_KEY)),
      collapsed: getInitialPdfSidebarCollapsed(localStorage.getItem(PDF_NAV_COLLAPSED_KEY)),
      sidebarWidth: getStoredSidebarWidth(localStorage.getItem(PDF_NAV_SIDEBAR_WIDTH_KEY)),
      leftPaneWidth: getStoredPaneWidth(localStorage.getItem(PDF_NAV_LEFT_PANE_WIDTH_KEY)),
      rightPaneWidth: getStoredPaneWidth(localStorage.getItem(PDF_NAV_RIGHT_PANE_WIDTH_KEY)),
    };
  } catch {
    return { ...DEFAULT_PDF_NAV_PREFS };
  }
}

export function savePdfNavigationPrefs(prefs: PdfNavigationPrefs) {
  try {
    localStorage.setItem(PDF_NAV_TAB_KEY, prefs.tab);
    localStorage.setItem(PDF_NAV_COLLAPSED_KEY, String(prefs.collapsed));
    localStorage.setItem(PDF_NAV_SIDEBAR_WIDTH_KEY, String(prefs.sidebarWidth));
    localStorage.setItem(PDF_NAV_LEFT_PANE_WIDTH_KEY, String(prefs.leftPaneWidth));
    localStorage.setItem(PDF_NAV_RIGHT_PANE_WIDTH_KEY, String(prefs.rightPaneWidth));
  } catch {
    // Ignore storage failures so reader navigation still works in memory.
  }
}
