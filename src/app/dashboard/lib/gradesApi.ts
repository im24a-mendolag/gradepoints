import type { Grade, School } from "../types";
import { toDateInputString } from "../utils";

const JSON_HEADERS = { "Content-Type": "application/json" };

function send(url: string, method: string, body?: unknown) {
  return fetch(url, {
    method,
    ...(body !== undefined && { headers: JSON_HEADERS, body: JSON.stringify(body) }),
  });
}

/** Runs a request once more after the server's Retry-After delay if it was rate limited. */
async function withRetry(request: () => Promise<Response>): Promise<Response> {
  const res = await request();
  if (res.status !== 429) return res;
  const wait = parseInt(res.headers.get("Retry-After") ?? "60", 10);
  await new Promise((r) => setTimeout(r, wait * 1000));
  return request();
}

/** Reads the API's `{ error }` message, falling back to a generic one. */
export async function apiError(res: Response, fallback: string): Promise<string> {
  try {
    return (await res.json()).error || fallback;
  } catch {
    return fallback;
  }
}

export const gradesApi = {
  create: (body: object) => send("/api/grades", "POST", body),
  update: (id: string, body: object) => send(`/api/grades/${id}`, "PUT", body),
  remove: (id: string) => send(`/api/grades/${id}`, "DELETE"),
  removeWithRetry: (id: string) => withRetry(() => gradesApi.remove(id)),
  createWithRetry: (body: object) => withRetry(() => gradesApi.create(body)),
};

export const adjustmentsApi = {
  save: (body: { value: number; semester: number; subject: string; school: School }) =>
    send("/api/adjustments", "POST", body),
  remove: (body: { semester: number; subject: string; school: School }) =>
    send("/api/adjustments", "DELETE", body),
};

/** The editable fields of an existing grade, in the shape the API accepts. */
export function gradeFields(g: Grade) {
  return {
    value: g.value,
    weight: g.weight,
    description: g.description,
    date: toDateInputString(g.date),
  };
}

/** Body that recreates a grade (used by undo of deletes). */
export function recreateBody(g: Grade) {
  return {
    ...gradeFields(g),
    semester: g.semester,
    subject: g.subject,
    ...(g.school !== "KSH" ? { school: g.school } : {}),
  };
}
