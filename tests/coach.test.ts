import { describe, it, expect } from "vitest";
import { lessons, misconceptions } from "../src/content";
import { basicDiagnosis, detectEvidence, recordAttempt, bestNextLesson } from "../src/coach";

describe("TraceNest learning coach", () => {
  it("ships practice missions", () => {
    expect(lessons.length).toBeGreaterThanOrEqual(5);
    expect(new Set(lessons.map((x) => x.id)).size).toBe(lessons.length);
  });
  it("returns an explainable diagnosis for starter code", () => {
    const lesson = lessons[0];
    const result = basicDiagnosis(lesson.starter, lesson);
    expect(result.mode).toBe("Transparent rules fallback");
    expect(result.solved).toBe(false);
    expect(result.diagnoses.length).toBeGreaterThan(0);
    expect(result.diagnoses[0].hint.length).toBeGreaterThan(0);
  });
  it("detects real evidence and no evidence for absent signals", () => {
    const boundary = misconceptions.find((x) => x.id === "boundary");
    expect(boundary).toBeDefined();
    expect(detectEvidence("if score > 50:", boundary!).length).toBeGreaterThan(0);
    expect(detectEvidence("print('hello')", boundary!)).toEqual([]);
  });
  it("records failures without claiming mastery", () => {
    const now = Date.UTC(2026, 10, 8);
    const progress = recordAttempt({}, lessons[0].id, false, now);
    expect(progress[lessons[0].id]).toMatchObject({attempts: 1, successful: 0, streak: 0});
    expect(progress[lessons[0].id].nextDue).toBe(now + 86400000);
  });
  it("spaces later successful repetition more widely", () => {
    const id = lessons[0].id;
    const now = Date.UTC(2026, 10, 8);
    const first = recordAttempt({}, id, true, now);
    const second = recordAttempt(first, id, true, now + 86400000);
    expect(second[id]).toMatchObject({attempts: 2, successful: 2, streak: 2});
    expect(second[id].nextDue - second[id].lastPracticed).toBe(3 * 86400000);
  });
  it("suggests another mission when the current one is excluded", () => {
    const recommended = bestNextLesson({}, lessons[0].id);
    expect(recommended.id).not.toBe(lessons[0].id);
  });
});
