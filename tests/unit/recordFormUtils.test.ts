import { describe, expect, it } from "vitest";
import {
  addDurationToClock,
  buildRecordRequestPayload,
  clampDurationDraft,
  durationFromStartAndEndClock,
  formatClockTime,
  formatDurationMinutes,
  formatJaDateWithWeekday,
  formatRecordCardDatetime,
  formatRecordDatetime,
  formatStudyDatetimeLabel,
  getDurationBadgeTier,
  isRecordDateString,
  localDateToRecordDateString,
  parseDatetimeLocalToIso,
  parseRecordDatetime,
  recordDateStringToLocalDate,
  shouldShowDurationBadge,
  STUDY_DURATION_HELP_TEXT,
  toDatetimeLocalString,
} from "../../src/react-app/features/records/recordFormUtils";

describe("recordFormUtils", () => {
  it("parseDatetimeLocalToIso returns ISO or null", () => {
    const iso = parseDatetimeLocalToIso("2026-08-01T12:00");
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(parseDatetimeLocalToIso("")).toBeNull();
    expect(parseDatetimeLocalToIso("not-a-date")).toBeNull();
  });

  it("toDatetimeLocalString formats valid ISO", () => {
    const local = toDatetimeLocalString("2026-08-01T12:00:00.000Z");
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(toDatetimeLocalString("bad")).toBe("");
  });

  it("toDatetimeLocalString snaps minutes to 5-minute steps", () => {
    expect(
      toDatetimeLocalString(new Date(2026, 7, 1, 9, 2, 0).toISOString()),
    ).toBe("2026-08-01T09:00");
    expect(
      toDatetimeLocalString(new Date(2026, 7, 1, 9, 58, 0).toISOString()),
    ).toBe("2026-08-01T10:00");
  });

  it("recordDateStringToLocalDate and localDateToRecordDateString round-trip", () => {
    const local = recordDateStringToLocalDate("2026-08-10");
    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(7);
    expect(local.getDate()).toBe(10);
    expect(localDateToRecordDateString(local)).toBe("2026-08-10");
    expect(recordDateStringToLocalDate("2026-08-10").getDate()).toBe(10);
  });

  it("parseRecordDatetime and formatRecordDatetime round-trip", () => {
    expect(parseRecordDatetime("2026-08-10T09:05")).toEqual({
      date: "2026-08-10",
      hour: 9,
      minute: 5,
    });
    expect(formatRecordDatetime("2026-08-10", 9, 5)).toBe("2026-08-10T09:05");
    expect(parseRecordDatetime("")).toBeNull();
    expect(parseRecordDatetime("2026-08-10T24:00")).toBeNull();
    expect(parseRecordDatetime("T15:58")).toBeNull();
    expect(isRecordDateString("2026-08-10")).toBe(true);
    expect(isRecordDateString("")).toBe(false);
    expect(isRecordDateString("08/28/2026")).toBe(false);
  });

  it("STUDY_DURATION_HELP_TEXT explains end time linkage", () => {
    expect(STUDY_DURATION_HELP_TEXT).toBe("学習日時の終了時刻と連動します");
  });

  it("formatDurationMinutes uses hours and minutes", () => {
    expect(formatDurationMinutes(5)).toBe("5分");
    expect(formatDurationMinutes(10)).toBe("10分");
    expect(formatDurationMinutes(60)).toBe("1時間");
    expect(formatDurationMinutes(90)).toBe("1時間30分");
    expect(formatDurationMinutes(1435)).toBe("23時間55分");
  });

  it("getDurationBadgeTier maps minutes to tier boundaries", () => {
    expect(getDurationBadgeTier(5)).toBe("under1h");
    expect(getDurationBadgeTier(59)).toBe("under1h");
    expect(getDurationBadgeTier(60)).toBe("h1to3");
    expect(getDurationBadgeTier(179)).toBe("h1to3");
    expect(getDurationBadgeTier(180)).toBe("h3to5");
    expect(getDurationBadgeTier(299)).toBe("h3to5");
    expect(getDurationBadgeTier(300)).toBe("h5to10");
    expect(getDurationBadgeTier(599)).toBe("h5to10");
    expect(getDurationBadgeTier(600)).toBe("h10plus");
    expect(getDurationBadgeTier(1435)).toBe("h10plus");
  });

  it("formatClockTime uses unpadded hours and 2-digit minutes", () => {
    expect(formatClockTime(0, 0)).toBe("0:00");
    expect(formatClockTime(23, 30)).toBe("23:30");
    expect(formatClockTime(25, 0)).toBe("25:00");
  });

  it("addDurationToClock wraps past midnight as 24h overflow", () => {
    expect(addDurationToClock(23, 30, 90)).toEqual({
      displayHour: 25,
      displayMinute: 0,
    });
  });

  it("formatJaDateWithWeekday formats date and weekday", () => {
    const date = new Date(2026, 11, 28);
    expect(formatJaDateWithWeekday(date)).toBe("2026年12月28日(月)");
  });

  it("formatStudyDatetimeLabel shows range when duration is set", () => {
    const iso = new Date(2026, 11, 28, 23, 30).toISOString();
    expect(formatStudyDatetimeLabel(iso, 90)).toBe(
      "2026年12月28日(月) 23:30-25:00",
    );
  });

  it("formatStudyDatetimeLabel shows start only without duration", () => {
    const iso = new Date(2026, 11, 28, 23, 30).toISOString();
    expect(formatStudyDatetimeLabel(iso, null)).toBe(
      "2026年12月28日(月) 23:30",
    );
    expect(formatStudyDatetimeLabel(iso, 0)).toBe("2026年12月28日(月) 23:30");
  });

  it("formatRecordCardDatetime falls back to createdAt without range", () => {
    const createdAt = new Date(2026, 11, 28, 15, 51).toISOString();
    expect(
      formatRecordCardDatetime({
        id: "r1",
        groupId: "g1",
        userId: "u1",
        startedAt: null,
        title: "t",
        durationMinutes: null,
        createdAt,
        updatedAt: createdAt,
        reactions: [],
      }),
    ).toBe("2026年12月28日(月) 15:51");
  });

  it("formatRecordCardDatetime shows overflow range when duration is set", () => {
    const startedAt = new Date(2026, 11, 28, 23, 30).toISOString();
    const createdAt = new Date(2026, 11, 28, 15, 51).toISOString();
    expect(
      formatRecordCardDatetime({
        id: "r1",
        groupId: "g1",
        userId: "u1",
        startedAt,
        title: "t",
        durationMinutes: 90,
        createdAt,
        updatedAt: createdAt,
        reactions: [],
      }),
    ).toBe("2026年12月28日(月) 23:30-25:00");
  });

  it("shouldShowDurationBadge requires both datetime and positive duration", () => {
    const createdAt = new Date(2026, 11, 28, 15, 51).toISOString();
    const base = {
      id: "r1",
      groupId: "g1",
      userId: "u1",
      title: "t",
      createdAt,
      updatedAt: createdAt,
      reactions: [],
    };
    expect(
      shouldShowDurationBadge({
        ...base,
        startedAt: null,
        durationMinutes: 10,
      }),
    ).toBe(false);
    expect(
      shouldShowDurationBadge({
        ...base,
        startedAt: createdAt,
        durationMinutes: null,
      }),
    ).toBe(false);
    expect(
      shouldShowDurationBadge({
        ...base,
        startedAt: createdAt,
        durationMinutes: 10,
      }),
    ).toBe(true);
  });

  it("durationFromStartAndEndClock treats equal clocks as zero", () => {
    expect(durationFromStartAndEndClock(12, 0, 12, 0)).toBe(0);
  });

  it("durationFromStartAndEndClock adds 24h when end is before start", () => {
    expect(durationFromStartAndEndClock(23, 30, 1, 0)).toBe(90);
  });

  it("durationFromStartAndEndClock allows 12 hours without clamping", () => {
    expect(durationFromStartAndEndClock(0, 0, 12, 0)).toBe(720);
  });

  it("durationFromStartAndEndClock clamps to 23 hours 55 minutes", () => {
    expect(durationFromStartAndEndClock(0, 0, 23, 59)).toBe(1435);
  });

  it("clampDurationDraft keeps zero and clamps to max", () => {
    expect(clampDurationDraft(0, -5)).toBe(0);
    expect(clampDurationDraft(0, 5)).toBe(5);
    expect(clampDurationDraft(1430, 10)).toBe(1435);
    expect(clampDurationDraft(1435, 5)).toBe(1435);
  });

  it("buildRecordRequestPayload allows unset datetime when title is set", () => {
    expect(
      buildRecordRequestPayload({
        startedAt: "",
        title: "x",
        memo: "",
        durationMinutes: 30,
      }),
    ).toEqual({
      startedAt: null,
      title: "x",
      memo: undefined,
      durationMinutes: null,
    });
  });

  it("buildRecordRequestPayload rejects empty title", () => {
    expect(
      buildRecordRequestPayload({
        startedAt: "",
        title: "   ",
        memo: "",
        durationMinutes: null,
      }),
    ).toBeNull();
  });

  it("buildRecordRequestPayload includes duration when set", () => {
    const payload = buildRecordRequestPayload({
      startedAt: "2026-08-01T12:00",
      title: "  数学  ",
      memo: "   ",
      durationMinutes: 30,
    });
    expect(payload).not.toBeNull();
    expect(payload?.title).toBe("数学");
    expect(payload?.memo).toBeUndefined();
    expect(payload?.durationMinutes).toBe(30);
  });

  it("buildRecordRequestPayload rejects invalid datetime", () => {
    expect(
      buildRecordRequestPayload({
        startedAt: "T15:58",
        title: "x",
        memo: "",
        durationMinutes: null,
      }),
    ).toBeNull();
  });

  it("buildRecordRequestPayload returns null when start is set without duration", () => {
    expect(
      buildRecordRequestPayload({
        startedAt: "2026-08-01T12:00",
        title: "x",
        memo: "",
        durationMinutes: null,
      }),
    ).toBeNull();
    expect(
      buildRecordRequestPayload({
        startedAt: "2026-08-01T12:00",
        title: "x",
        memo: "",
        durationMinutes: 0,
      }),
    ).toBeNull();
  });
});
