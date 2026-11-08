import { lessons, misconceptions } from "./content";
import type { Lesson, Misconception } from "./content";

export interface Diagnosis {
  id: string;
  label: string;
  confidence: number;
  evidence: string[];
  hint: string;
  nextStep: string;
}
export interface Review {
  solved: boolean;
  explanation: string;
  mode: "On-device AI + code evidence" | "Transparent rules fallback";
  diagnoses: Diagnosis[];
  caution: string;
}
export interface ProgressEntry {
  attempts: number;
  successful: number;
  lastPracticed: number;
  nextDue: number;
  streak: number;
}
export type Progress = Record<string, ProgressEntry>;

const STORAGE = "tracenest_progress_v1";
const DAY = 86_400_000;

export function readProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Progress;
  } catch {
    // Corrupt browser storage must never prevent practice.
  }
  return {};
}

export function recordAttempt(progress: Progress, lessonId: string, solved: boolean, now = Date.now()): Progress {
  const old = progress[lessonId] || { attempts: 0, successful: 0, lastPracticed: 0, nextDue: 0, streak: 0 };
  const streak = solved ? old.streak + 1 : 0;
  const days = solved ? Math.min(30, Math.pow(2, Math.min(streak, 5)) - 1) : 1;
  return {
    ...progress,
    [lessonId]: {
      attempts: old.attempts + 1,
      successful: old.successful + (solved ? 1 : 0),
      lastPracticed: now,
      nextDue: now + days * DAY,
      streak
    }
  };
}

export function bestNextLesson(progress: Progress, currentId?: string, now = Date.now()): Lesson {
  const due = lessons.filter((l) => (progress[l.id]?.nextDue || 0) <= now && l.id !== currentId);
  const pool = due.length ? due : lessons.filter((l) => l.id !== currentId);
  const sorted = pool.sort((a, b) => {
    const aAttempts = progress[a.id]?.attempts ?? 0;
    const bAttempts = progress[b.id]?.attempts ?? 0;
    if (aAttempts !== bAttempts) return aAttempts - bAttempts;
    return a.difficulty - b.difficulty;
  });
  return sorted[0] || lessons[0];
}

export function detectEvidence(code: string, concept: Misconception): string[] {
  const hits: string[] = [];
  for (const expression of concept.signals) {
    const match = expression.exec(code);
    if (match) hits.push(match[0].trim().slice(0, 95));
  }
  return hits;
}

export function basicDiagnosis(code: string, lesson: Lesson): Review {
  const solved = lesson.passPattern.test(code);
  if (solved) {
    return {
      solved: true,
      explanation: lesson.explanation,
      mode: "Transparent rules fallback",
      diagnoses: [],
      caution: "Kiểm tra mẫu mã, không thực thi hoặc chứng minh đúng toàn bộ chương trình."
    };
  }
  const ordered = misconceptions.map((item) => {
    const evidence = detectEvidence(code, item);
    const prior = item.id === lesson.bugId ? 0.30 : 0;
    const confidence = Math.min(0.95, 0.20 + Math.min(evidence.length, 2) * 0.25 + prior);
    return { item, evidence, confidence };
  }).filter((row) => row.evidence.length > 0 || row.item.id === lesson.bugId);
  ordered.sort((a, b) => b.confidence - a.confidence);
  return {
    solved: false,
    explanation: "Chưa thấy mẫu sửa lỗi mục tiêu trong code. Hãy thử từng giá trị biên.",
    mode: "Transparent rules fallback",
    diagnoses: ordered.slice(0, 3).map(({item, evidence, confidence}) => ({
      id: item.id, label: item.label, hint: item.hint, nextStep: item.nextStep, evidence, confidence
    })),
    caution: "Đây là gợi ý quy tắc, không phải kết quả chạy code. Không tự động chấm điểm tuyển dụng."
  };
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return dot / (Math.sqrt(aa) * Math.sqrt(bb) || 1);
}

type EmbeddingFunction = (text: string) => Promise<number[]>;
let embeddingsPromise: Promise<EmbeddingFunction> | null = null;

export async function loadLocalEmbeddingModel(onStatus?: (status: string) => void): Promise<EmbeddingFunction> {
  if (!embeddingsPromise) {
    embeddingsPromise = (async () => {
      onStatus?.("Đang nạp mô hình MiniLM vào trình duyệt. Lần đầu cần tải trọng số từ Hugging Face.");
      const mod = await import("@huggingface/transformers");
      const model = await mod.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8" });
      const embed = async (text: string): Promise<number[]> => {
        const result = await model(text, { pooling: "mean", normalize: true });
        return Array.from(result.data as Float32Array);
      };
      onStatus?.("MiniLM đã sẵn sàng — suy luận chạy trên thiết bị.");
      return embed;
    })().catch((error) => {
      embeddingsPromise = null;
      throw error;
    });
  }
  return embeddingsPromise;
}

let cachedConcepts: number[][] | null = null;
export async function semanticReview(
  code: string,
  lesson: Lesson,
  onStatus?: (status: string) => void
): Promise<Review> {
  const base = basicDiagnosis(code, lesson);
  if (base.solved || code.trim().length < 10) return base;
  try {
    const embed = await loadLocalEmbeddingModel(onStatus);
    if (!cachedConcepts) {
      onStatus?.("Đang lập bản đồ các lỗi tư duy mẫu...");
      cachedConcepts = await Promise.all(misconceptions.map((m) => embed(m.reference)));
    }
    const vector = await embed("Task: " + lesson.prompt + "\nStudent code:\n" + code);
    const diagnoses = misconceptions.map((concept, i): Diagnosis => {
      const evidence = detectEvidence(code, concept);
      const semanticSimilarity = Math.max(0, cosine(vector, cachedConcepts![i]));
      const semantic = Math.max(0, Math.min(1, (semanticSimilarity - 0.20) / 0.60));
      const rule = Math.min(1, evidence.length * 0.70);
      const prior = concept.id === lesson.bugId ? 0.17 : 0;
      const confidence = Math.min(0.97, 0.18 + 0.40 * semantic + 0.30 * rule + prior);
      return { id: concept.id, label: concept.label, confidence, evidence, hint: concept.hint, nextStep: concept.nextStep };
    });
    diagnoses.sort((a, b) => b.confidence - a.confidence);
    return {
      ...base,
      mode: "On-device AI + code evidence",
      diagnoses: diagnoses.slice(0, 3),
      caution: "Điểm tin cậy chỉ là ước lượng gợi ý. Mô hình ngữ nghĩa không chạy/thực thi code và có thể sai."
    };
  } catch {
    onStatus?.("Không tải được mô hình AI; tiếp tục bằng bằng chứng quy tắc minh bạch.");
    return base;
  }
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE);
}
export function saveProgress(progress: Progress): void {
  localStorage.setItem(STORAGE, JSON.stringify(progress));
}
