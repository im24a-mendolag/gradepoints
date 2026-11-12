// Renders UI inside the real DashboardProvider against the fake API, waiting for the initial load.
import { act, render, waitFor } from "@testing-library/react";
import { expect } from "vitest";
import type { ReactNode } from "react";
import { DashboardProvider } from "@/app/dashboard/DashboardContext";
import type { Adjustment, Grade, School } from "@/app/dashboard/types";
import { installFakeApi } from "./fakeApi";

/** Lets pending fetch promises and the state updates they trigger settle. */
export async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

export async function renderDashboard(
  ui: ReactNode,
  opts: { grades?: Grade[]; adjustments?: Adjustment[]; school?: School; semester?: number } = {},
) {
  const api = installFakeApi({ grades: opts.grades, adjustments: opts.adjustments });
  const utils = render(
    <DashboardProvider initialSchool={opts.school} initialSemester={opts.semester}>
      {ui}
    </DashboardProvider>,
  );
  await waitFor(() => {
    expect(api.fetchMock).toHaveBeenCalledWith("/api/grades");
    expect(api.fetchMock).toHaveBeenCalledWith("/api/adjustments");
  });
  await flush();
  return { ...utils, ...api };
}
