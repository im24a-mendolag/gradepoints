// @vitest-environment jsdom
// Loads the real popup.html + popup.js into jsdom with a stubbed `chrome` API.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/dom";

const html = readFileSync(join(process.cwd(), "extension/popup.html"), "utf8");
document.body.innerHTML = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));

const row = (title: string, value: string, date = "", weight = "") =>
  `<tr data-uid="x"><td data-field="title">${title}</td><td data-field="value">${value}</td>` +
  `<td data-field="date">${date}</td><td data-field="gradeWeight">${weight}</td></tr>`;
const subject = (name: string, rows: string) =>
  `<tr class="k-master-row"><td data-field="courseName">${name}</td></tr>` +
  `<tr class="k-detail-row"><td><table>${rows}</table></td></tr>`;

const GRADEBOOK =
  `<div class="gb-grid-header">◄ 1. Semester 2025/26 ►</div><table>` +
  subject("Mathematik", row("Test 1", "5,5", "15.09.2025", "1") + row("Bonus", "0,25") + row("Schnitt", "5") + row("Bad", "9", "15.09.2025", "1")) +
  subject("IDAF TuU", row("Projekt", "5", "01.10.2025", "1")) +
  subject("IDAF WR", row("Essay", "4", "02.10.2025", "0,5")) +
  subject("Sport", row("Lauf", "6", "03.10.2025", "1")) +
  subject("Nur Schnitt", row("Schnitt", "5")) +
  `<tr class="k-master-row"><td data-field="courseName">No detail</td></tr>` +
  `<tr class="k-master-row"><td data-field="courseName"></td></tr></table>`;

/** Runs the injected scraper against `markup` mounted in the same document. */
function scrapeWith(markup: string) {
  return async ({ func }: { func: () => unknown }) => {
    const host = document.createElement("div");
    host.innerHTML = markup;
    document.body.appendChild(host);
    try {
      return [{ result: func() }];
    } finally {
      host.remove();
    }
  };
}

const chrome = {
  tabs: { query: vi.fn(), create: vi.fn() },
  scripting: { executeScript: vi.fn() },
};
const fetchMock = vi.fn();

const $ = (id: string) => document.getElementById(id)!;
const visibleState = () =>
  [...document.querySelectorAll<HTMLElement>("[data-state]")].find((el) => !el.hidden)?.dataset.state;
const onIntranet = () => chrome.tabs.query.mockResolvedValue([{ id: 7, url: "https://intranet.tam.ch/ksh/gradebook" }]);
const ok = () => new Response("{}", { status: 200 });

async function retry(expected: string) {
  $("retry-btn").click();
  await waitFor(() => expect(visibleState()).toBe(expected));
}

async function capture(markup = GRADEBOOK) {
  chrome.scripting.executeScript.mockImplementation(scrapeWith(markup));
  $("capture-btn").click();
  await waitFor(() => expect(visibleState()).not.toBe("loading"));
}

function chooseSemester(value: string) {
  const select = $("semester-select") as HTMLSelectElement;
  select.value = value;
  select.dispatchEvent(new Event("change"));
}

const cards = () => [...document.querySelectorAll<HTMLElement>(".subject-card")];
const cardFor = (text: string) => cards().find((c) => c.textContent!.includes(text))!;
const importBtn = (card: HTMLElement) => card.querySelector<HTMLButtonElement>(".btn-import")!;

beforeAll(async () => {
  vi.stubGlobal("chrome", chrome);
  vi.stubGlobal("fetch", fetchMock);
  chrome.tabs.query.mockResolvedValue([{ url: "https://example.com" }]);
  // @ts-expect-error -- plain browser script, loaded for its side effects
  await import("./popup.js");
  document.dispatchEvent(new Event("DOMContentLoaded"));
  await waitFor(() => expect(visibleState()).toBe("wrong-page"));
});

beforeEach(() => {
  vi.stubGlobal("chrome", chrome);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset().mockResolvedValue(ok());
  onIntranet(); // restoreMocks clears stub implementations between tests
});

describe("popup init", () => {
  it("asks for the Notenbuch page elsewhere", () => {
    expect(visibleState()).toBe("wrong-page");
  });

  it("reports tab access failures", async () => {
    chrome.tabs.query.mockRejectedValue(new Error("denied"));
    await retry("error");
    expect($("error-msg").textContent).toBe("Could not read the current tab.");
  });

  it("asks to log in when GradePoints returns 401", async () => {
    onIntranet();
    fetchMock.mockResolvedValue(new Response("", { status: 401 }));
    await retry("not-logged-in");
  });

  it("is ready when logged in, or when the check fails offline", async () => {
    onIntranet();
    fetchMock.mockRejectedValue(new Error("offline"));
    await retry("ready");
  });
});

describe("capturing grades", () => {
  it("reports capture failures", async () => {
    chrome.tabs.query.mockRejectedValueOnce(new Error("denied"));
    await capture();
    expect($("error-msg").textContent).toBe("Could not access the current tab.");

    onIntranet();
    chrome.scripting.executeScript.mockRejectedValue(new Error("blocked"));
    $("capture-btn").click();
    await waitFor(() => expect($("error-msg").textContent).toMatch(/Could not read the page/));

    await capture("<p>nothing here</p>");
    expect($("error-msg").textContent).toMatch(/No subject rows found/);

    await capture(`<p>Semester overview</p><table>${subject("Mathematik", row("Schnitt", "5"))}</table>`);
    expect($("error-msg").textContent).toMatch(/no grades detected/);

    chrome.scripting.executeScript.mockResolvedValue([{ result: { subjects: [] } }]);
    $("capture-btn").click();
    await waitFor(() => expect($("error-msg").textContent).toMatch(/No grades found/));

    chrome.scripting.executeScript.mockResolvedValue([{}]);
    $("capture-btn").click();
    await waitFor(() => expect($("error-msg").textContent).toBe("Failed to find grade data on this page."));
  });

  it("previews resolved, merged and unknown subjects", async () => {
    await capture();
    expect(visibleState()).toBe("preview");
    expect($("semester-label").textContent).toBe("1. Semester 2025/26");
    expect(cards()).toHaveLength(3);

    const math = cardFor("Math");
    expect(importBtn(math).textContent).toBe("Import 1+adj");
    expect(math.querySelector(".bonus-row .grade-value")!.textContent).toBe("+0.25");
    expect(cardFor("IDAF").querySelector(".merged-note")!.textContent).toBe("merged: IDAF TuU, IDAF WR");
    expect(cardFor("Sport").querySelector("select")).toBeTruthy();
    expect(cards().every((c) => importBtn(c).disabled)).toBe(true);
  });

  it("hides the school semester label when the page has none", async () => {
    // (Fed pre-scraped: in jsdom the popup's own "semester" labels share the page document.)
    chrome.scripting.executeScript.mockResolvedValue([
      { result: { semesterLabel: null, subjects: [{ subjectRaw: "Englisch", grades: [{ title: "", value: 4, date: "2025-01-01", weight: 1 }], bonuses: [] }] } },
    ]);
    $("capture-btn").click();
    await waitFor(() => expect(visibleState()).toBe("preview"));
    expect(($("semester-label-row") as HTMLElement).hidden).toBe(true);
    expect(cardFor("English").querySelector(".grade-title")!.textContent).toBe("—");
  });
});

describe("importing", () => {
  beforeEach(() => capture());

  it("imports one subject with its adjustment once a semester is chosen", async () => {
    chooseSemester("3");
    const math = cardFor("Math");
    expect(importBtn(math).disabled).toBe(false);
    importBtn(math).click();
    await waitFor(() => expect(importBtn(math).textContent).toBe("✓ Done"));

    const bodies = fetchMock.mock.calls.map(([url, init]) => [url, JSON.parse(init.body)]);
    expect(bodies).toEqual([
      ["https://gradepoints.mendolag.ch/api/grades", { value: 5.5, weight: 1, description: "Test 1", date: "2025-09-15", semester: 3, subject: "Math", school: "KSH" }],
      ["https://gradepoints.mendolag.ch/api/adjustments", { value: 0.25, semester: 3, subject: "Math", school: "KSH" }],
    ]);
  });

  it("shows API errors on the subject's button", async () => {
    chooseSemester("1");
    fetchMock.mockResolvedValueOnce(ok()).mockResolvedValueOnce(new Response("{}", { status: 500 }));
    importBtn(cardFor("Math")).click();
    await waitFor(() => expect(importBtn(cardFor("Math")).title).toBe("Adjustment failed: HTTP 500"));

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Invalid semester" }), { status: 400 }));
    importBtn(cardFor("IDAF")).click();
    await waitFor(() => expect(importBtn(cardFor("IDAF")).textContent).toBe("✗ Error"));
    expect(importBtn(cardFor("IDAF")).title).toBe("Invalid semester");
  });

  it("retries rate-limited requests and imports everything", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    chooseSemester("2");
    const sport = cardFor("Sport").querySelector("select")!;
    sport.value = "TuU";
    sport.dispatchEvent(new Event("change"));

    fetchMock.mockResolvedValueOnce(new Response("", { status: 429, headers: { "Retry-After": "1" } }));
    $("import-all-btn").click();
    await vi.advanceTimersByTimeAsync(1000);
    await waitFor(() => expect($("import-all-btn").textContent).toBe("✓ All imported"));
    vi.useRealTimers();

    expect(($("all-done-bar") as HTMLElement).hidden).toBe(false);
    $("open-gp-btn").click();
    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: "https://gradepoints.mendolag.ch/dashboard" });
  });
});
