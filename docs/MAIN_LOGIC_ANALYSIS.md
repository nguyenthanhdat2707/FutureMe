# Phân tích logic chính của Future Me

## 1. Mục đích của project

Future Me là backend hỗ trợ người dùng ra quyết định dựa trên bối cảnh cá nhân: mục tiêu, lịch bận, các cam kết hiện có, quan sát gần đây và mức năng lượng. Ở MVP hiện tại, hệ thống không để LLM tự quyết định tính khả thi. Phần kết luận `feasible`/`at-risk`/`not-feasible` được tính bằng luật xác định (deterministic rules); LLM chỉ được dùng để tạo phần diễn giải trade-off có kiểm soát.

Điểm vào HTTP nằm ở `src/app.ts`. Các API chính được gắn dưới `/api/context`, `/api/decisions`, `/api/calendar`, `/api/observations`, `/api/outcomes` và `/api/demo`.

## 2. Luồng chính: hỏi một quyết định

Đây là logic trung tâm của product. Client gọi:

```text
POST /api/decisions
{
  "userId": "...",
  "query": {
    "question": "Tôi có nên nhận thêm việc này không?",
    "options": ["Nhận", "Từ chối"],
    "impactProfile": { ... }
  }
}
```

Luồng xử lý:

```text
HTTP request
  -> decisionRouter
  -> MockDecisionEngine.supportDecision(...)
  -> lấy relevant context
  -> assessDecisionFeasibility(impactProfile)
  -> gọi LLM để lấy trade-offs dạng JSON
  -> validate trade-offs
  -> kết hợp DecisionSupport
  -> lưu Decision vào SQLite
  -> trả JSON về client
```

Các vị trí thực thi:

- Route nhận request và lưu kết quả: `src/routes/decision.routes.ts:12`.
- Engine điều phối luồng quyết định: `src/intelligence/mock-decision-engine.ts:30`.
- Thuật toán đánh giá tính khả thi: `src/intelligence/deterministic-feasibility-assessment.ts:92`.
- Repository lưu/quy đổi decision: `src/repositories/decision.repository.ts:26`.

`userId` mặc định là `demo-user` nếu request không truyền giá trị. Đây là hành vi demo/MVP, không phải xác thực người dùng thực.

## 3. `impactProfile`: dữ liệu quyết định dựa vào đâu

Kiểu dữ liệu nằm tại `src/domain/types.ts:145`. Các trường quan trọng:

| Trường | Ý nghĩa |
|---|---|
| `timeCostHours` | Số giờ cam kết mới cần dùng. |
| `availableHoursBeforeDeadline` | Số giờ còn có thể dùng trước hạn. |
| `deadline` | Có thể dùng thay cho `availableHoursBeforeDeadline`; hệ thống tính số giờ còn lại từ thời điểm hiện tại đến hạn. |
| `workloadHoursBeforeDeadline` | Khối lượng công việc đang tồn trước hạn. |
| `energyCost` | Năng lượng cần cho cam kết mới. |
| `availableEnergy` | Năng lượng hiện còn. |
| `goalRelevance` | Mức độ liên quan với mục tiêu: low/medium/high. Hiện chỉ làm confidence cao hơn một chút, không đổi nhãn feasibility. |
| `source` | Nguồn dữ liệu: `user-confirmed`, `provided`, hoặc `estimated`; ảnh hưởng confidence và evidence. |

Ví dụ input đủ dữ liệu:

```json
{
  "question": "Tôi có nên nhận thêm workshop?",
  "impactProfile": {
    "timeCostHours": 4,
    "availableHoursBeforeDeadline": 20,
    "workloadHoursBeforeDeadline": 8,
    "energyCost": 3,
    "availableEnergy": 8,
    "goalRelevance": "high",
    "source": "user-confirmed"
  }
}
```

## 4. Thuật toán feasibility (logic có thẩm quyền)

Hàm `assessDecisionFeasibility` là nguồn quyết định chính. Nó không suy đoán khi thiếu dữ liệu cốt lõi.

### 4.1. Kiểm tra dữ liệu đầu vào

Một giá trị số chỉ hợp lệ khi là số hữu hạn và không âm (`src/intelligence/deterministic-feasibility-assessment.ts:14`).

- Thiếu `timeCostHours` hoặc thiếu cả `availableHoursBeforeDeadline` lẫn `deadline` -> `needs-info`.
- Nếu không có `workloadHoursBeforeDeadline`, hệ thống tạm tính workload = 0, đồng thời ghi rõ assumption và yêu cầu bổ sung thông tin.
- Nếu thiếu dữ liệu năng lượng, `energyFit = unknown`. Điều này không tự động làm kết quả là `needs-info`, miễn hai dữ liệu cốt lõi về thời gian có mặt.

### 4.2. Tính capacity thời gian

Công thức:

```text
projectedRemainingCapacityHours
= availableTimeBeforeDeadlineHours
- workloadHoursBeforeDeadline
- timeCostHours
```

Nếu chỉ có `deadline`, hệ thống tính:

```text
availableTimeBeforeDeadlineHours
= max(0, deadline - assessmentTime)
```

Lưu ý: khi dùng deadline, đây là thời gian đồng hồ đã trôi qua, không đồng nghĩa toàn bộ số giờ đó đều là giờ làm việc thực tế. Assumption này được trả về trong response.

### 4.3. Phân loại áp lực deadline

| Điều kiện | `deadlinePressure` |
|---|---|
| Capacity còn âm | `high` |
| Capacity còn lại <= 25% thời gian khả dụng, hoặc thời gian khả dụng = 0 | `moderate` |
| Còn lại nhiều hơn ngưỡng trên | `low` |
| Không thể tính capacity | `unknown` |

### 4.4. Phân loại energy fit

```text
remainingEnergy = availableEnergy - energyCost
```

| Điều kiện | `energyFit` |
|---|---|
| Năng lượng còn âm | `poor` |
| Còn <= 20% năng lượng ban đầu, hoặc availableEnergy = 0 | `strained` |
| Còn nhiều hơn ngưỡng trên | `good` |
| Thiếu một trong hai input năng lượng | `unknown` |

### 4.5. Quy tắc kết luận

Thứ tự ưu tiên là quan trọng:

```text
1. Thiếu time cost hoặc thời gian tới deadline -> needs-info
2. Capacity âm hoặc energyFit = poor          -> not-feasible
3. Deadline moderate hoặc energy strained     -> at-risk
4. Các trường hợp còn lại                     -> feasible
```

Mỗi kết luận sinh recommendation tương ứng:

| Feasibility | Recommendation option |
|---|---|
| `needs-info` | `clarify` |
| `not-feasible` | `do-not-proceed` |
| `at-risk` | `proceed-with-caution` |
| `feasible` | `proceed` |

Response còn trả về `evidence`, `assumptions`, `missingData` để UI giải thích lý do thay vì chỉ hiện một nhãn kết luận.

## 5. Confidence được tính như thế nào

Confidence không phải xác suất thành công thực tế; nó là độ đầy đủ/tin cậy của input cho assessment.

Mốc gốc theo `source`:

| Source | Confidence gốc |
|---|---:|
| `user-confirmed` | 0.80 |
| `provided` | 0.65 |
| `estimated` | 0.55 |

Sau đó cộng thêm:

- +0.10 nếu có đủ hai giá trị năng lượng.
- +0.05 nếu có `goalRelevance`.
- +0.05 nếu workload được cung cấp, tức không phải dùng giả định workload = 0.
- Bị giới hạn tối đa 0.95.
- Nếu thiếu dữ liệu cốt lõi, confidence = 0.

## 6. Vai trò của LLM: diễn giải, không quyết định

`MockDecisionEngine` vẫn gọi `ILLMProvider` để tạo `tradeoffs` như lợi ích và chi phí của từng phương án (`src/intelligence/mock-decision-engine.ts:64`). Nhưng LLM không có quyền sửa recommendation, reasoning hay confidence của assessment.

Cơ chế bảo vệ:

1. Prompt yêu cầu JSON với danh sách trade-offs.
2. JSON được parse bằng Zod.
3. Mỗi trade-off phải có `option`, `gains`, `costs`; chuỗi rỗng, sai kiểu, hoặc field thừa bị loại.
4. Recommendation trong `Decision` luôn lấy từ deterministic assessment, không lấy từ output LLM (`src/intelligence/mock-decision-engine.ts:84`).

Vì vậy, kể cả khi LLM trả về “proceed” với confidence 1.0, hệ thống vẫn trả `do-not-proceed` nếu input cho thấy capacity âm.

## 7. Context được thu thập và dùng thế nào

`SimpleContextEngine` hiện là phiên bản MVP/provisional (`src/intelligence/simple-context-engine.ts`). Nó lấy dữ liệu từ SQLite:

- `personal_context`: goal, commitment, preference dưới dạng JSON.
- `decisions`: các quyết định gần đây.
- `calendar_events`: lịch sắp tới.
- `observations`: quan sát trong 24 giờ gần nhất.

Khi build `RelevantContext`, implementation hiện trả toàn bộ goals và commitments, đồng thời biến observations thành chuỗi lịch sử. Nó chưa thực sự lọc theo nội dung `query`; đây là giới hạn có chủ ý của MVP (`src/intelligence/simple-context-engine.ts:89`).

Context hiện được đưa vào prompt để LLM viết trade-off. Tuy nhiên feasibility hiện tính trực tiếp từ `impactProfile`, không tự suy ra workload/time/energy từ calendar hoặc context. Điều này giúp kết luận minh bạch và có thể kiểm chứng, nhưng yêu cầu client cung cấp input impact đúng.

## 8. Personal state và intervention

Đây là logic hỗ trợ khác với decision feasibility:

### State estimator

`SimpleStateEstimator` có các rule:

1. Không có observation trong 30 phút -> `UNCERTAIN` với confidence 0.7.
2. Có observation gần đây nhưng bận quá 8 giờ hôm nay -> `OVERLOADED` với confidence 0.65.
3. Còn lại -> `FLOW` với confidence 0.6.

Xem `src/intelligence/simple-state-estimator.ts:10`.

### Intervention policy

`SimpleInterventionPolicy` quyết định có nên nhắc người dùng không:

- `UNCERTAIN` và có decision `PENDING` -> gợi ý review decision.
- `OVERLOADED` -> thông báo nhẹ, gợi ý review priorities.
- Trường hợp khác -> không can thiệp.

Xem `src/intelligence/simple-intervention-policy.ts:10`.

## 9. Persistence và kiến trúc thay thế được

SQLite schema ở `src/database/schema.ts:6` lưu các thực thể: users, personal context, decisions, observations, calendar events, outcomes, feedback.

`src/services/service-container.ts` là lớp dependency injection đơn giản. Nó tạo singleton cho context engine, decision engine, state estimator, intervention policy và các adapter. MVP hiện dùng `MockLLMProvider` và `MockCalendarAdapter`, nên chưa gọi AWS Bedrock hoặc Google Calendar thật.

Thiết kế interface giúp thay implementation sau này mà không đổi route chính:

```text
Route -> interface -> implementation hiện tại
                    -> implementation thật trong tương lai
```

Ví dụ: `ILLMProvider` có thể đổi từ mock sang Bedrock; `ICalendarAdapter` có thể đổi sang Google Calendar; `IContextEngine` có thể đổi từ retrieval toàn bộ sang retrieval theo mức liên quan.

## 10. LLM Context Analyst độc lập

`BoundedLLMContextAnalyst` là một chức năng khác, không trực tiếp quyết định feasibility. Nó nhận một request đã được rút gọn gồm signals, evidence và context attributes; sau đó chỉ đề xuất:

- hypothesis về context;
- câu hỏi clarification cho người dùng.

Nó không được phép xác nhận fact, chấm điểm hay ra quyết định. Output bị từ chối hoàn toàn nếu JSON sai, sai schema hoặc tham chiếu ID không tồn tại (`src/intelligence/bounded-llm-context-analyst.ts:67`). Khi hợp lệ, mọi item vẫn có trạng thái `proposed`, chưa phải fact đã xác nhận.

## 11. Ví dụ kết quả end-to-end

Với input ở phần 3:

```text
capacity = 20 - 8 - 4 = 8 giờ
energy còn lại = 8 - 3 = 5
=> deadlinePressure = low
=> energyFit = good
=> feasibility = feasible
=> recommendation = proceed
```

Nếu thay bằng `timeCostHours = 10`, `availableHoursBeforeDeadline = 8`, `workloadHoursBeforeDeadline = 2`:

```text
capacity = 8 - 2 - 10 = -4 giờ
=> deadlinePressure = high
=> feasibility = not-feasible
=> recommendation = do-not-proceed
```

Nếu không có `timeCostHours` hoặc deadline/available hours:

```text
=> feasibility = needs-info
=> recommendation = clarify
=> response trả clarificationNeeded để UI hỏi lại người dùng
```

## 12. Những giới hạn hiện tại cần biết

- Các route chưa validate chặt request body ở boundary; lỗi input có thể đi vào catch và trả 500 thay vì 400 rõ ràng.
- `SimpleContextEngine.getRelevantContext` chưa thực sự chọn context theo relevance; đang trả tất cả context.
- State trong relevant context đang được hard-code là `FLOW`, chưa dùng `SimpleStateEstimator`.
- Decision repository chưa persist `options` và `tradeoffs` riêng; khi đọc decision lại, hai field này trở thành mảng rỗng (`src/repositories/decision.repository.ts:69`).
- `deadline` tính theo clock-time, không trừ calendar events hay giờ nghỉ.
- Rule thresholds (25% time, 20% energy, 8 giờ busy) là rule MVP provisional, chưa được calibration bằng dữ liệu người dùng.
- Adapter LLM và Calendar đang là mock; chưa có tích hợp external service thật.

## 13. Test đã bao phủ logic nào

Các test liên quan trực tiếp:

- `src/__tests__/decision-feasibility.test.ts`: kiểm tra feasible, over-capacity/not-feasible, thiếu input/needs-info, và việc LLM không thể ghi đè deterministic recommendation.
- `src/__tests__/llm-harness.test.ts`: kiểm tra LLM context analyst chỉ nhận compact payload, reject output lỗi/unknown reference, và chỉ giữ trade-offs hợp lệ.
- `src/__tests__/routes.integration.test.ts`: kiểm tra các flow API và persistence ở route level.

Khi thay đổi logic chính, cần chạy:

```text
npm run test
npm run lint
npm run build
```
