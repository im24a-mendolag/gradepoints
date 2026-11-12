// In-memory stand-in for the /api/grades and /api/adjustments endpoints, installed as global fetch.
import { vi } from "vitest";
import type { Adjustment, Grade } from "@/app/dashboard/types";

type Req = { method: string; url: string; body: Record<string, unknown> };
type Handler = (req: Req) => Response | undefined;
type Db = { grades: Grade[]; adjustments: Adjustment[] };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

let nextId = 1000;

export function grade(partial: Partial<Grade> & Pick<Grade, "subject" | "value">): Grade {
  return {
    id: `g${nextId++}`,
    weight: 1,
    description: "",
    date: "2025-01-15T00:00:00.000Z",
    semester: 1,
    school: "KSH",
    ...partial,
  };
}

function gradesCollection(db: Db, { method, body }: Req) {
  if (method === "GET") return json(db.grades);
  const created = grade({ ...body, school: body.school ?? "KSH" } as Grade);
  db.grades.push(created);
  return json(created, 201);
}

function gradeItem(db: Db, id: string, { method, body }: Req) {
  const g = db.grades.find((x) => x.id === id);
  if (!g) return json({ error: "Grade not found" }, 404);
  if (method === "DELETE") {
    db.grades = db.grades.filter((x) => x.id !== id);
    return json({ message: "Grade deleted" });
  }
  Object.assign(g, body);
  return json(g);
}

function adjustmentsCollection(db: Db, { method, body }: Req) {
  const school = (a: { school?: unknown }) => a.school ?? "KSH";
  const matches = (a: Adjustment) => a.semester === body.semester && a.subject === body.subject && school(a) === school(body);
  if (method === "GET") return json(db.adjustments);
  if (method === "DELETE") {
    db.adjustments = db.adjustments.filter((a) => !matches(a));
    return json({ success: true });
  }
  const existing = db.adjustments.find(matches);
  if (existing) existing.value = body.value as number;
  else db.adjustments.push({ id: `a${nextId++}`, ...body } as Adjustment);
  return json(db.adjustments.find(matches));
}

function route(db: Db, req: Req): Response {
  const id = req.url.match(/^\/api\/grades\/([^/?]+)/)?.[1];
  if (id) return gradeItem(db, id, req);
  if (req.url.startsWith("/api/grades")) return gradesCollection(db, req);
  if (req.url.startsWith("/api/adjustments")) return adjustmentsCollection(db, req);
  if (/^\/api\/(account|register)/.test(req.url)) return json({ message: "ok" });
  return json({ error: "not found" }, 404);
}

/**
 * Installs a fetch mock backed by mutable `grades` / `adjustments` arrays.
 * `override` can intercept a request first (return a Response to short-circuit).
 */
export function installFakeApi(initial: { grades?: Grade[]; adjustments?: Adjustment[] } = {}, override?: Handler) {
  const db: Db = { grades: [...(initial.grades ?? [])], adjustments: [...(initial.adjustments ?? [])] };

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req: Req = {
      url: String(input),
      method: (init?.method ?? "GET").toUpperCase(),
      body: init?.body ? JSON.parse(String(init.body)) : {},
    };
    return override?.(req) ?? route(db, req);
  });

  vi.stubGlobal("fetch", fetchMock);
  return { db, fetchMock };
}

export { json };
