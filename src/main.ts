import "./styles.css";
import { lessons, misconceptions } from "./content";
import type { Lesson } from "./content";
import {
  basicDiagnosis, semanticReview, readProgress, saveProgress, recordAttempt,
  bestNextLesson, clearProgress
} from "./coach";
import type { Review } from "./coach";

type State = {
  activeId: string;
  code: string;
  review: Review | null;
  busy: boolean;
  aiEnabled: boolean;
  status: string;
  progress: ReturnType<typeof readProgress>;
};

const codeKey = (id: string) => "tracenest_code_" + id;
const initial = lessons[0];
const state: State = {
  activeId: initial.id,
  code: localStorage.getItem(codeKey(initial.id)) ?? initial.starter,
  review: null,
  busy: false,
  aiEnabled: localStorage.getItem("tracenest_ai") === "on",
  status: "",
  progress: readProgress()
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing root application");

function html(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character
  );
}
function lesson(): Lesson { return lessons.find((x) => x.id === state.activeId) ?? lessons[0]; }
function mastered(id: string): boolean { return (state.progress[id]?.successful ?? 0) > 0; }
function progressStats() {
  return {
    attempted: Object.values(state.progress).reduce((sum, x) => sum + x.attempts, 0),
    mastered: lessons.filter((l) => mastered(l.id)).length
  };
}
function lessonTile(l: Lesson, index: number): string {
  const active = state.activeId === l.id;
  const pass = mastered(l.id);
  return '<button class="lesson-item ' + (active ? "active" : "") + '" type="button" data-lesson="' + l.id + '" aria-pressed="' + active + '">' +
    '<span class="lesson-index">' + (pass ? "✓" : String(index + 1).padStart(2, "0")) + "</span>" +
    '<span class="lesson-meta"><strong>' + html(l.title) + '</strong><small>' + html(l.language.toUpperCase()) + ' · LV ' + l.difficulty + "</small></span>" +
    '<span class="lesson-chevron" aria-hidden="true">›</span></button>';
}
function resultMarkup(): string {
  if (!state.review) {
    return '<div class="empty-feedback"><div class="empty-icon" aria-hidden="true">✦</div>' +
      '<h3>Lỗi cũng là một manh mối</h3><p>Nhấn <strong>Phân tích code</strong> để nhận gợi ý từng bước. Không thực thi mã của bạn trên máy chủ.</p>' +
      '<span class="micro-note">Gợi ý đầu tiên sẽ xuất hiện ở đây.</span></div>';
  }
  const r = state.review;
  if (r.solved) {
    return '<div class="feedback-solved"><div class="solved-spark">✦</div><h3>Đã thấy cách sửa đúng!</h3>' +
      '<p>' + html(r.explanation) + '</p><p class="caution">' + html(r.caution) + '</p>' +
      '<button type="button" class="btn primary" id="next-task">Bài tiếp theo <span aria-hidden="true">↗</span></button></div>';
  }
  const rows = r.diagnoses.map((d, i) => {
    const confidence = Math.round(d.confidence * 100);
    return '<article class="diagnosis"><div class="diag-heading">' +
      '<span class="diag-order">' + (i + 1) + '</span><strong>' + html(d.label) + '</strong>' +
      '<span class="confidence">Độ phù hợp ~' + confidence + '%</span></div>' +
      '<p>' + html(d.hint) + '</p>' +
      (d.evidence.length ? '<div class="evidence"><span>Bằng chứng trong code</span><code>' + html(d.evidence[0]) + '</code></div>' : '') +
      '<div class="micro-action"><span aria-hidden="true">↳</span>' + html(d.nextStep) + '</div></article>';
  }).join("");
  return '<div class="feedback-header"><span class="result-dot"></span><span>' + html(r.mode) + '</span></div>' +
    '<h3>Có thể bạn đang vướng ở đây</h3><p class="feedback-lead">Đây là gợi ý định hướng, không hiển thị lời giải hoàn chỉnh.</p>' +
    rows + '<p class="caution">' + html(r.caution) + "</p>";
}
function render(): void {
  if (!app) return;
  const l = lesson();
  const stats = progressStats();
  const percentage = Math.round(stats.mastered / lessons.length * 100);
  const next = bestNextLesson(state.progress, state.activeId);
  app.innerHTML = '<div class="shell">' +
    '<header class="site-header"><a class="brand" href="./" aria-label="Trang chủ TraceNest"><span class="brand-mark" aria-hidden="true">✳</span><span>trace<span class="brand-accent">nest</span></span></a>' +
    '<div class="header-links"><span class="privacy-label"><span class="tiny-lock" aria-hidden="true">⌁</span> Local-first · Private by design</span>' +
    '<a class="header-link" href="https://github.com/TDUmii" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div></header>' +
    '<main><section class="hero"><div><div class="eyebrow"><span class="eyebrow-dot"></span> A GENTLER WAY TO DEBUG</div>' +
    '<h1>Your next <em>aha!</em><br>starts with a mistake.</h1>' +
    '<p>AI hỗ trợ tìm lỗi tư duy trong bài code nhỏ, gợi ý bước tiếp theo và ôn lại đúng lúc. Không cần tài khoản, không cần API key.</p>' +
    '<div class="hero-tags"><span>◈ Code understanding</span><span>◴ Adaptive practice</span><span>♡ Student privacy</span></div></div>' +
    '<div class="progress-card"><div class="progress-icon">✦</div><span class="progress-label">YOUR LEARNING TRAIL</span>' +
    '<div class="progress-value">' + stats.mastered + ' <small>/ ' + lessons.length + '</small></div>' +
    '<span class="progress-caption">Bài đã sửa đúng ít nhất một lần</span>' +
    '<div class="progress-bar"><span style="width:' + percentage + '%"></span></div>' +
    '<div class="progress-footer"><span>' + percentage + '% hoàn thành</span><span>' + stats.attempted + ' lượt luyện</span></div></div></section>' +
    '<section class="workspace" aria-label="Không gian luyện code"><aside class="sidebar">' +
    '<div class="section-caption"><span>01</span> YOUR LITTLE MISSIONS</div>' +
    '<h2>Chọn một thử thách <span class="flower">✳</span></h2>' +
    '<p class="sidebar-intro">Mỗi thử thách chỉ tập trung vào một lỗi tư duy.</p>' +
    '<div class="lesson-list">' + lessons.map(lessonTile).join("") + '</div>' +
    '<div class="suggested"><span>✧ GỢI Ý LUYỆN TIẾP</span><strong>' + html(next.title) + '</strong>' +
    '<button type="button" id="recommended" class="text-action">Mở bài gợi ý ↗</button></div></aside>' +
    '<div class="work-main"><div class="section-caption"><span>02</span> TRY IT YOURSELF</div>' +
    '<div class="task-heading"><div><div class="task-badges"><span>' + html(l.language) + '</span><span>Độ khó ' + l.difficulty + '/3</span></div>' +
    '<h2>' + html(l.title) + '</h2><p>' + html(l.prompt) + '</p></div><div class="task-icon" aria-hidden="true">⌘</div></div>' +
    '<div class="task-expected"><span aria-hidden="true">✓</span> <span><strong>Mục tiêu: </strong>' + html(l.expected) + '</span></div>' +
    '<div class="editor-card"><div class="editor-toolbar"><div class="editor-dots" aria-hidden="true"><i></i><i></i><i></i></div>' +
    '<span class="filename">practice.' + (l.language === "python" ? "py" : "js") + '</span>' +
    '<button id="reset-code" type="button" class="toolbar-action">↺ Đặt lại</button></div>' +
    '<div class="editor-content"><div class="line-numbers" aria-hidden="true" id="line-numbers"></div>' +
    '<textarea id="code-editor" aria-label="Khung viết mã" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off"></textarea></div></div>' +
    '<div class="analyze-bar"><label class="ai-toggle"><input type="checkbox" id="ai-toggle" ' + (state.aiEnabled ? "checked" : "") + '/>' +
    '<span class="switch-track"></span><span>On-device AI <small>MiniLM · tải khi cần</small></span></label>' +
    '<button id="analyze" type="button" class="btn primary" ' + (state.busy ? "disabled" : "") + '>' +
    (state.busy ? "Đang phân tích…" : "✦ Phân tích code") + '</button></div>' +
    '<div class="status-line" role="status" id="model-status">' + html(state.status || "Mẹo: Ctrl + Enter để phân tích · Mã không được gửi lên máy chủ.") + '</div>' +
    '<div class="feedback-panel" aria-live="polite"><div class="section-caption"><span>03</span> LEARN FROM IT</div>' +
    resultMarkup() + '</div></div></section>' +
    '<section class="how"><div><span class="section-caption"><span>04</span> HOW TRACENEST LEARNS</span>' +
    '<h2>Để hiểu lỗi, không phải chép đáp án.</h2></div>' +
    '<div class="how-steps"><div><span>01 /</span><strong>Quan sát</strong><p>Nhận diện lỗi điển hình, đưa ra bằng chứng và mức độ chắc chắn.</p></div>' +
    '<div><span>02 /</span><strong>Thử lại</strong><p>Chỉ gợi ý một bước nhỏ để người học tự sửa code.</p></div>' +
    '<div><span>03 /</span><strong>Nhớ lâu hơn</strong><p>Bài còn yếu được đề xuất luyện lại bằng lịch ôn tăng dần.</p></div></div></section>' +
    '<div class="privacy-note"><span aria-hidden="true">♧</span> Mã và tiến độ chỉ nằm trong trình duyệt của bạn. Trọng số AI tải từ kho Hugging Face, suy luận cục bộ. ' +
    '<button id="clear-data" type="button">Xóa tiến độ</button></div></main>' +
    '<footer><span>✳ TraceNest AI — built for SLAY HACKS 2026</span><span>Prototype · feedback not a formal code execution test</span></footer></div>';
  const editor = document.querySelector<HTMLTextAreaElement>("#code-editor");
  if (editor) {
    editor.value = state.code;
    editor.addEventListener("input", () => {
      state.code = editor.value;
      localStorage.setItem(codeKey(state.activeId), state.code);
      showLineNumbers();
    });
    editor.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        const start = editor.selectionStart;
        editor.setRangeText("    ", start, editor.selectionEnd, "end");
        editor.dispatchEvent(new Event("input"));
      }
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault(); void analyze();
      }
    });
    showLineNumbers();
  }
  document.querySelectorAll<HTMLButtonElement>("[data-lesson]").forEach((button) =>
    button.addEventListener("click", () => selectLesson(button.dataset.lesson || l.id))
  );
  document.querySelector("#recommended")?.addEventListener("click", () => selectLesson(next.id));
  document.querySelector("#reset-code")?.addEventListener("click", () => {
    if (!window.confirm("Đặt lại code về mẫu ban đầu của bài này?")) return;
    state.code = lesson().starter;
    state.review = null;
    localStorage.setItem(codeKey(l.id), state.code);
    render();
  });
  document.querySelector("#ai-toggle")?.addEventListener("change", (event) => {
    state.aiEnabled = (event.target as HTMLInputElement).checked;
    localStorage.setItem("tracenest_ai", state.aiEnabled ? "on" : "off");
    state.status = state.aiEnabled ? "AI sẽ chạy ngay trong trình duyệt." : "Chế độ quy tắc được bật — không cần tải mô hình.";
    render();
  });
  document.querySelector("#analyze")?.addEventListener("click", () => void analyze());
  document.querySelector("#next-task")?.addEventListener("click", () => selectLesson(bestNextLesson(state.progress, state.activeId).id));
  document.querySelector("#clear-data")?.addEventListener("click", () => {
    if (!window.confirm("Xóa tiến độ luyện tập đã lưu trên thiết bị?")) return;
    clearProgress(); state.progress = {};
    state.review = null; state.status = "Đã xóa tiến độ trên thiết bị.";
    render();
  });
}
function showLineNumbers(): void {
  const editor = document.querySelector<HTMLTextAreaElement>("#code-editor");
  const gutter = document.querySelector<HTMLElement>("#line-numbers");
  if (!editor || !gutter) return;
  const count = Math.max(8, editor.value.split("\n").length);
  gutter.textContent = Array.from({ length: count }, (_, i) => String(i + 1)).join("\n");
}
function selectLesson(id: string) {
  const next = lessons.find((l) => l.id === id) ?? lessons[0];
  state.activeId = next.id;
  state.code = localStorage.getItem(codeKey(next.id)) ?? next.starter;
  state.review = null;
  state.status = "";
  render();
  document.querySelector("#code-editor")?.scrollIntoView({ behavior: "smooth", block: "center" });
}
async function analyze() {
  if (state.busy) return;
  const l = lesson();
  const draft = state.code;
  state.busy = true;
  state.status = state.aiEnabled ? "Chuẩn bị phân tích cục bộ..." : "Phân tích bằng quy tắc minh bạch...";
  render();
  let result: Review;
  if (state.aiEnabled) {
    result = await semanticReview(draft, l, (message) => {
      state.status = message;
      const status = document.querySelector("#model-status");
      if (status) status.textContent = message;
    });
  } else {
    result = basicDiagnosis(draft, l);
  }
  state.review = result;
  state.progress = recordAttempt(state.progress, l.id, result.solved);
  saveProgress(state.progress);
  state.busy = false;
  state.status = result.mode === "On-device AI + code evidence"
    ? "Suy luận cục bộ hoàn tất. Không mã nào được gửi lên máy chủ."
    : "Phân tích quy tắc hoàn tất. Bật AI để thêm ngữ nghĩa khi có mạng.";
  render();
}
render();
