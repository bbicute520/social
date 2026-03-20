import { describe, expect, it } from "vitest"
import { formatRelativeTime } from "./time"

describe("formatRelativeTime", () => {
  const t = (key: string, params?: Record<string, string | number>) => {
    if (!params) {
      return key
    }

    return `${key}:${JSON.stringify(params)}`
  }

  it("returns just now for a recent timestamp", () => {
    const now = new Date().toISOString()
    expect(formatRelativeTime(now, "vi", t)).toBe("time.justNow")
  })

  it("returns minutes ago key with count", () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    expect(formatRelativeTime(twoMinutesAgo, "en", t)).toContain("time.minutesAgo")
  })

  it("returns localized date for old timestamps", () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const result = formatRelativeTime(oldDate, "vi", t)
    expect(result).not.toBe("time.justNow")
    expect(result).toContain("/")
  })
})
