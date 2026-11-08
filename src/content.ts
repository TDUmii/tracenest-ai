export type Language = "python" | "javascript";
export type Topic = "boundaries" | "loops" | "state" | "conditions" | "types" | "arrays";

export interface Lesson {
  id: string;
  title: string;
  language: Language;
  topic: Topic;
  difficulty: 1 | 2 | 3;
  prompt: string;
  expected: string;
  starter: string;
  passPattern: RegExp;
  bugId: string;
  explanation: string;
}
export interface Misconception {
  id: string;
  label: string;
  category: Topic;
  reference: string;
  hint: string;
  nextStep: string;
  signals: RegExp[];
}

export const misconceptions: Misconception[] = [
  {
    id: "boundary",
    label: "Inequality boundary",
    category: "boundaries",
    reference: "A score exactly 50 should qualify but code uses greater than > rather than greater-than-or-equal >=. Inclusive boundary condition bug. Example Python: if score > 50: when the requirement says 50 or above.",
    hint: "Kiểm tra xem giá trị đúng bằng ngưỡng có được tính không. Toán tử > bỏ qua điểm bằng ngưỡng; thử kiểm tra trường hợp score = 50.",
    nextStep: "Tự kiểm thử với ba giá trị: 49, 50 và 51. Giải thích vì sao kết quả phải khác nhau.",
    signals: [/score\s*>\s*50\b/i, /(?:age|points)\s*>\s*(?:18|10)\b/i]
  },
  {
    id: "off-by-one",
    label: "Off-by-one iteration",
    category: "loops",
    reference: "Python range upper bound is exclusive, range(1,10) excludes 10 when listing 1 through 10. JavaScript arrays use indices smaller than length; i <= array.length goes too far. An off by one loop error.",
    hint: "Giới hạn trên của range trong Python KHÔNG được lấy. Nếu muốn có số 10, điểm dừng phải là 11.",
    nextStep: "In thử list(range(1, 10)) rồi list(range(1, 11)) để thấy sự khác biệt.",
    signals: [/range\(\s*1\s*,\s*10\s*\)/i, /<=\s*(?:numbers|items|arr)\.length/i]
  },
  {
    id: "reset-state",
    label: "Accumulator reset inside loop",
    category: "state",
    reference: "Summing a list incorrectly resets sum or total variable to zero inside a for loop on every iteration. Accumulator initialization belongs before loop.",
    hint: "Nếu total = 0 được đặt bên trong vòng lặp, mỗi lượt đều xóa kết quả trước đó. Hãy khởi tạo biến tổng một lần TRƯỚC vòng lặp.",
    nextStep: "Thử với [2, 3, 4] và ghi tổng sau từng lượt: 2 → 5 → 9.",
    signals: [/for\s+\w+\s+in[^\n]*:\s*\n\s*(?:total|sum)\s*=\s*0\b/i, /for\s*\([^)]+\)\s*\{\s*(?:let|var)\s+(?:total|sum)\s*=\s*0/i]
  },
  {
    id: "assignment",
    label: "Assignment instead of comparison",
    category: "conditions",
    reference: "JavaScript if (x = 5) assigns value 5 instead of checking equality with ===. Assignment in condition is a common programming misconception.",
    hint: "Dấu = là phép gán, không phải phép so sánh. Với JavaScript, dùng === để so sánh cả giá trị lẫn kiểu dữ liệu.",
    nextStep: "Chạy x = 3 trước lệnh if và kiểm tra x có bị đổi thành 5 hay không.",
    signals: [/if\s*\(\s*[A-Za-z_$]\w*\s*=\s*[^=]/i]
  },
  {
    id: "infinite-loop",
    label: "Loop variable is not updated",
    category: "loops",
    reference: "Python while count < 5: print(count) never increments count and loops forever. Add count += 1 inside loop; make progress toward termination.",
    hint: "Điều kiện while cần thay đổi trong khi chương trình chạy. Bạn đã cập nhật biến đếm để vòng lặp có thể kết thúc chưa?",
    nextStep: "Dự đoán count sau mỗi vòng và xác nhận chương trình kết thúc ở count = 5.",
    signals: [/while\s+count\s*<\s*5\s*:\s*\n\s*print\(\s*count\s*\)/i]
  },
  {
    id: "input-type",
    label: "Text versus number",
    category: "types",
    reference: "Python input() returns a string. Comparing input() == 7 will always fail; convert to int(input()) or compare against string '7'.",
    hint: "input() trả về chuỗi. Muốn so sánh với số 7, hãy chuyển đổi bằng int() hoặc so sánh chuỗi '7'.",
    nextStep: "In type(input()) rồi thử int(input()) để phân biệt str và int.",
    signals: [/input\(\)\s*==\s*\d+/i]
  },
  {
    id: "list-index",
    label: "Array index out of range",
    category: "arrays",
    reference: "JavaScript for(let i=0;i<=items.length;i++) accesses one element past last array index. Use i < items.length for valid indices.",
    hint: "Chỉ số phần tử cuối là length - 1. Điều kiện i <= items.length làm chương trình đọc vượt khỏi mảng.",
    nextStep: "Liệt kê chỉ số hợp lệ của một mảng 3 phần tử, sau đó thử truy cập items[3].",
    signals: [/i\s*<=\s*items\.length/i, /i\s*<=\s*arr\.length/i]
  }
];

export const lessons: Lesson[] = [
  {
    id: "score-boundary",
    title: "Cửa qua môn",
    language: "python",
    topic: "boundaries",
    difficulty: 1,
    prompt: "Một bạn đạt từ 50 điểm trở lên thì được nhận huy hiệu. Sửa chương trình để đúng cả khi score = 50.",
    expected: "score = 50 phải in ra 'Pass'.",
    starter: "score = 50\nif score > 50:\n    print('Pass')\nelse:\n    print('Try again')",
    passPattern: /if\s+score\s*>=\s*50\s*:/i,
    bugId: "boundary",
    explanation: "Dấu >= bao gồm chính giá trị 50. Đây là lỗi ranh giới điển hình."
  },
  {
    id: "count-to-ten",
    title: "Đếm đủ 10",
    language: "python",
    topic: "loops",
    difficulty: 1,
    prompt: "In các số từ 1 đến 10, bao gồm cả 10. Hãy sửa vòng lặp.",
    expected: "Dòng cuối phải là 10.",
    starter: "for i in range(1, 10):\n    print(i)",
    passPattern: /range\(\s*1\s*,\s*11\s*\)/i,
    bugId: "off-by-one",
    explanation: "range(1, 11) tạo các số 1..10 do điểm dừng 11 không được tính."
  },
  {
    id: "sum-list",
    title: "Cộng không mất điểm",
    language: "python",
    topic: "state",
    difficulty: 2,
    prompt: "Cộng [2, 3, 4] để được 9. Mỗi vòng lặp phải giữ lại tổng cũ.",
    expected: "total cuối cùng bằng 9.",
    starter: "numbers = [2, 3, 4]\nfor n in numbers:\n    total = 0\n    total += n\nprint(total)",
    passPattern: /total\s*=\s*0\s*\n\s*for\s+\w+\s+in\s+numbers/i,
    bugId: "reset-state",
    explanation: "Khởi tạo total = 0 trước for, sau đó cộng dồn trong mỗi vòng."
  },
  {
    id: "equal-not-assign",
    title: "5 có phải là 5?",
    language: "javascript",
    topic: "conditions",
    difficulty: 1,
    prompt: "Không được thay đổi x trong phép kiểm tra. Sửa code để so sánh bằng.",
    expected: "Với x = 3, kết quả phải là 'No match'.",
    starter: "let x = 3;\nif (x = 5) {\n  console.log('Match');\n} else {\n  console.log('No match');\n}",
    passPattern: /if\s*\(\s*x\s*===\s*5\s*\)/i,
    bugId: "assignment",
    explanation: "=== dùng để so sánh trong JavaScript, còn = là phép gán."
  },
  {
    id: "while-progress",
    title: "Vòng lặp có điểm dừng",
    language: "python",
    topic: "loops",
    difficulty: 2,
    prompt: "Chương trình phải in 0, 1, 2, 3, 4 rồi kết thúc, không chạy mãi.",
    expected: "Có câu lệnh tăng count bên trong while.",
    starter: "count = 0\nwhile count < 5:\n    print(count)",
    passPattern: /while\s+count\s*<\s*5\s*:\s*\n(?:[^\n]*\n)*\s*count\s*(?:\+=\s*1|=\s*count\s*\+\s*1)/i,
    bugId: "infinite-loop",
    explanation: "Cập nhật biến điều kiện giúp vòng lặp tiến về điểm kết thúc."
  },
  {
    id: "type-seven",
    title: "Số 7 hay chữ '7'?",
    language: "python",
    topic: "types",
    difficulty: 2,
    prompt: "Đọc một giá trị và xác nhận nếu người dùng nhập số 7.",
    expected: "Khi nhập 7, chương trình phải nhận đúng.",
    starter: "if input() == 7:\n    print('Seven!')",
    passPattern: /(?:int\s*\(\s*input\(\)\s*\)\s*==\s*7|input\(\)\s*==\s*['"]7['"])/i,
    bugId: "input-type",
    explanation: "input() nhận văn bản; so sánh với chuỗi '7' hoặc ép thành int."
  },
  {
    id: "array-boundary",
    title: "Không bước ra ngoài mảng",
    language: "javascript",
    topic: "arrays",
    difficulty: 2,
    prompt: "Đọc tất cả phần tử trong items, không truy cập vị trí không tồn tại.",
    expected: "Đọc 3 phần tử mà không có undefined.",
    starter: "const items = ['red', 'blue', 'green'];\nfor (let i = 0; i <= items.length; i++) {\n  console.log(items[i]);\n}",
    passPattern: /i\s*<\s*items\.length/i,
    bugId: "list-index",
    explanation: "Chỉ số cuối cùng là items.length - 1, vì đếm từ 0."
  }
];
