import { describe, it, expect } from "vitest";
import { formatTime, formatPercent } from "../utils/format";

describe("format", () => {
  it("formats times", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(65_999)).toBe("01:05");
    expect(formatTime(3_725_000)).toBe("1:02:05");
    expect(formatTime(null)).toBe("—");
  });

  it("formats percents", () => {
    expect(formatPercent(0.666)).toBe("67%");
  });
});
