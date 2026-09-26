import { describe, it, expect } from "vitest";
import { formatTime } from "../utils/format";

describe("slide formatTime", () => {
  it("formats times", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(65_999)).toBe("01:05");
    expect(formatTime(3_725_000)).toBe("1:02:05");
    expect(formatTime(null)).toBe("—");
  });
});
