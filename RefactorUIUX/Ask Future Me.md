Dưới đây là bản **UI/UX Design Spec bằng Markdown** cho trang **Ask Future Me** theo đúng hướng bạn vừa chốt:

- **giữa là ô chat chính**
- **bên trái là lịch sử chat / decision history**
- **bên phải là calendar / agenda context**
- **đơn giản, sạch, không phức tạp**

---

# Future Me — Ask Future Me Page

## UI/UX Design Specification v1.0

---

## 1. Overview

### Product

**Future Me**

### Screen

**Ask Future Me**

### Primary Purpose

Trang này là nơi người dùng:

- đặt câu hỏi về một quyết định,
- xem ngữ cảnh liên quan,
- nhận phản hồi từ Future Me,
- tham khảo lại các cuộc trò chuyện / quyết định trước đó,
- đồng thời luôn nhìn thấy lịch và commitments hiện tại ở bên phải.

### Core Principle

Trang **Ask Future Me** không phải chỉ là một chatbot.

Nó phải tạo cảm giác rằng:

- người dùng đang nói chuyện với một AI companion,
- AI này có thể hỗ trợ reasoning dựa trên **context**,
- và context quan trọng nhất lúc này là:
    - lịch hiện tại,
    - commitments,
    - deadlines,
    - các quyết định trước đây.

---

# 2. Design Goals

Trong vài giây đầu, người dùng cần hiểu được:

1. **Đây là nơi tôi có thể hỏi về một quyết định.**
2. **Future Me không chỉ chat, mà còn dùng context.**
3. **Tôi có thể xem lại lịch sử câu hỏi trước đó.**
4. **Tôi có thể nhìn lịch hiện tại mà không phải chuyển trang.**

---

# 3. Layout Direction

## Overall Layout

Trang sử dụng **3-column layout** đơn giản:

```
┌────────────────────────────────────────────────────────────────────┐
│ Left Sidebar     │ Main Chat Area                │ Right Calendar │
│ History          │ Ask Future Me                 │ Agenda         │
└────────────────────────────────────────────────────────────────────┘
```

### Column Roles

#### Left Sidebar

Hiển thị:

- history các cuộc trò chuyện / decisions trước,
- danh sách recent threads hoặc previous questions.

#### Main Chat Area

Hiển thị:

- current conversation,
- relevant context card,
- response của Future Me,
- input composer.

#### Right Calendar Panel

Hiển thị:

- agenda / lịch hiện tại,
- upcoming events,
- deadlines,
- các blocks thời gian gần nhất.

---

# 4. Information Architecture

## 4.1 Left Sidebar — History

Mục đích:

- giúp người dùng quay lại các decision cũ,
- nhìn được các câu hỏi gần đây,
- giữ cảm giác đây là một workspace có continuity.

## 4.2 Main Chat Area — Current Decision

Mục đích:

- là vùng làm việc chính,
- nơi user tương tác trực tiếp với Future Me.

## 4.3 Right Panel — Calendar Context

Mục đích:

- cho người dùng thấy schedule hiện tại,
- giúp Future Me screen không bị tách rời khỏi real-life context,
- tránh việc user phải nhảy qua calendar page.

---

# 5. Layout Specifications

## 5.1 Desktop Layout

|Property|Specification|
|---|---|
|Page background|`#F5F7FC` hoặc soft lavender-tinted gray|
|Main app padding|`16–20px`|
|Main content height|`calc(100vh - topbar)`|
|Page structure|3 columns|
|Border radius|`24–28px`|
|Gap between columns|`12–16px`|

### Column Width Ratio

|Column|Width|
|---|---|
|Left Sidebar|`20–22%`|
|Main Chat Area|`48–54%`|
|Right Calendar Panel|`26–30%`|

### Recommended Default

```
Left Sidebar   = 22%
Main Chat      = 50%
Right Calendar = 28%
```

---

# 6. Global Visual Style

## Design Tone

- Calm
- Minimal
- Soft futuristic
- Premium but not flashy
- Clean productivity / personal intelligence feeling

## Visual Characteristics

- rounded containers,
- soft shadows,
- light borders,
- subtle purple accent,
- lots of whitespace,
- low visual noise.

## Avoid

- quá nhiều floating cards,
- quá nhiều biểu đồ,
- dark cyberpunk visuals,
- overly decorative illustrations,
- dashboard overload.

---

# 7. Page Structure

```
AskFutureMePage
├── Top App Header
├── Main 3-Column Layout
│   ├── LeftSidebarHistory
│   ├── MainChatWorkspace
│   └── RightCalendarPanel
```

---

# 8. Top App Header

## Purpose

Header nhẹ, gọn, không chiếm quá nhiều sự chú ý.

## Content

- App name / logo: `Future Me`
- Optional page title: `Ask Future Me`
- Optional user/profile actions ở góc phải

## Recommended Layout

```
Future Me                                    Search / Profile / Settings
```

## Style

- height: `64–72px`
- background: same page bg or subtle translucent white
- border bottom: very light
- sticky optional

---

# 9. Left Sidebar — History Panel

## 9.1 Purpose

Sidebar này để hiển thị lịch sử các conversation / decision threads.

Người dùng có thể:

- xem lại câu hỏi trước,
- quay lại thread cũ,
- tiếp tục conversation trước đó.

## 9.2 Content Structure

```
History
[ Search / filter optional ]

Today
- Should I join the hackathon?
- Can I take this freelance project?

Yesterday
- Should I skip the meetup?
- How should I prepare for the interview?

Earlier
- Review internship application timeline
- Decide whether to join AWS event
```

## 9.3 Sections

- Panel header
- Search or filter (optional)
- Grouped history list
- Active selected item state

## 9.4 Interaction

- click item → mở conversation tương ứng ở main chat
- selected item → highlighted state
- hover → subtle surface tint

## 9.5 Style

|Property|Value|
|---|---|
|Panel background|`#FFFFFF`|
|Radius|`24px`|
|Padding|`16px`|
|Title size|`18px`|
|List item radius|`14–16px`|
|List item padding|`10–12px`|
|Active item background|soft purple tint|
|Active item text|darker emphasis|

## 9.6 Content Rule

Mỗi history item nên ngắn gọn:

- question title,
- optional timestamp,
- optional status tag.

### Example

```
Should I join the hackathon?
2h ago
```

or

```
Review competition submission
Yesterday
```

---

# 10. Main Chat Area

## 10.1 Purpose

Đây là trung tâm của toàn trang.

Nó phải:

- chiếm ưu thế thị giác,
- dễ đọc,
- dễ nhập câu hỏi,
- hiển thị response rõ ràng,
- có block context liên quan.

## 10.2 Main Structure

```
Main Chat Area
├── Chat Header
├── Conversation Thread
│   ├── User Message
│   ├── Future Me Message
│   ├── Relevant Context Card
│   ├── Follow-up reasoning / response
│   └── Suggestion chips
└── Input Composer
```

---

# 11. Chat Header

## Content

- Title: `Future Me`
- Subtitle: `Your context-aware decision companion`

## Optional Actions

- more menu
- context panel toggle
- conversation actions

## Example

```
Future Me
Your context-aware decision companion
```

---

# 12. Conversation Thread

## 12.1 Message Types

- User message
- Future Me response
- Context block
- Suggestion chips / action pills

## 12.2 Example Flow

```
YOU
Should I join a hackathon when my project deadline is so close?

FUTURE ME
Let’s look at this in the context of your current priorities.

[Relevant Context Card]

Joining the hackathon could be a great learning opportunity,
but it may reduce your available time for the MVP.
We can compare the trade-offs.
```

---

# 13. User Message Design

## Style

- aligned left or slightly inset
- soft tinted bubble
- avatar optional
- timestamp small and muted

## Recommended Appearance

- bubble bg: `#EEE9FF` or soft purple tint
- text: dark neutral
- radius: `18–20px`

---

# 14. Future Me Message Design

## Style

- separate visual identity from user message
- includes avatar/icon
- cleaner, lighter message card
- may include structured blocks

## Recommended Appearance

- background: white or very subtle neutral
- radius: `18–20px`
- border: light gray
- spacing between sections generous

---

# 15. Relevant Context Card

## Purpose

Đây là phần cực kỳ quan trọng để thể hiện sự khác biệt của Future Me.

Nó cho user thấy rằng Future Me đang reasoning dựa trên context liên quan, không chỉ trả lời như chatbot bình thường.

## Content Example

|Context|Value|
|---|---|
|Active goal|Complete project MVP|
|Deadline|In 3 days (Fri, Oct 27)|
|Preference|Morning deep work|
|Upcoming events|2 meetings today|

## Layout

Card nằm bên trong Future Me response.

## Style

- bordered light card
- small section label: `RELEVANT CONTEXT`
- 2-column key/value layout
- optional “View details” link

---

# 16. Response Body

Sau context card, Future Me nên có đoạn reasoning ngắn, rõ, dễ đọc.

### Example

> Joining the hackathon could be a great learning opportunity, but it may reduce your available time for the MVP. We can compare the options and see the trade-offs.

## Writing Tone

- calm
- supportive
- not overly authoritative
- not commanding
- not pretending certainty

---

# 17. Suggestion Chips

## Purpose

Giúp user tiếp tục tương tác nhanh mà không phải tự nghĩ prompt tiếp theo.

## Example Chips

- `Explore options`
- `Understand trade-offs`
- `Check buffer time`

## Style

- pill buttons
- subtle tint
- low emphasis hơn primary CTA

## Behavior

click chip → populate follow-up action / send follow-up query

---

# 18. Input Composer

## Purpose

Cho user nhập câu hỏi mới hoặc follow-up.

## Structure

```
[ icon ] Ask anything about your decisions...                 [ send ]
```

## Features

- text input
- send button
- optional attach / voice later (not required now)

## Placeholder

```
Ask anything about your decisions...
```

## Style

- pinned ở bottom của main chat panel
- rounded pill / rounded container
- send button nổi bật bằng accent color

---

# 19. Right Calendar Panel

## 19.1 Purpose

Panel này giúp user luôn nhìn thấy schedule/commitments hiện tại.

Nó không phải full calendar management screen.

Nó là **supporting context panel**.

## 19.2 Content

- current date header
- today agenda
- tomorrow agenda
- deadline highlight
- end-of-day summary card

## 19.3 Example Structure

```
THURSDAY
October 24, 2024

09:00
Deep Work — Project MVP

12:30
Lunch with Team

15:00
Product Review

18:30
Gym

TOMORROW · OCT 25
10:00 Client Review
14:00 Team Sync

FRIDAY · OCT 26
23:59 MVP Deadline
```

---

# 20. Calendar Event Card Design

## Style

Dùng style giống mobile agenda:

- card event bo tròn,
- hẹp và cao,
- có accent color nhỏ ở cạnh trái hoặc badge,
- readable at a glance.

## Event Content

- time
- title
- category badge optional

## Example

```
09:00
Deep Work — Project MVP
[Focus]
```

---

# 21. Calendar Panel Header

## Content

- weekday
- date
- optional search / calendar icon

## Example

```
THURSDAY
October 24, 2024
```

## Style

- weekday small uppercase
- date large and bold

---

# 22. Summary Card

Cuối panel nên có một summary card nhỏ.

## Example

```
That’s everything for today.
You have 4 events tomorrow starting at 10:00.
```

## Purpose

- kết thúc panel gọn gàng,
- tạo cảm giác friendly,
- thêm chút warmth.

---

# 23. Visual Hierarchy

Thứ tự ưu tiên thị giác:

```
1. Main Chat Area
2. Current Future Me response
3. Relevant Context Card
4. Input Composer
5. Right Calendar Panel
6. Left Sidebar History
7. Header
```

Điều này đảm bảo user hiểu rằng:

- chat là trung tâm,
- context là lý do tạo khác biệt,
- lịch sử và calendar là hỗ trợ.

---

# 24. User Flows

## 24.1 Start a New Decision

1. user vào trang
2. thấy main chat ở giữa
3. nhập câu hỏi vào composer
4. Future Me phản hồi
5. context card xuất hiện
6. user tiếp tục follow-up bằng chips hoặc typed response

## 24.2 Reopen a Previous Decision

1. user click history item ở sidebar trái
2. thread tương ứng mở ở main chat
3. calendar vẫn visible ở bên phải
4. user tiếp tục conversation

## 24.3 Check Schedule While Asking

1. user nhìn sang right panel
2. xem event / deadline hiện tại
3. quay lại chat ngay mà không cần đổi trang

---

# 25. Responsive Behavior

## 25.1 Desktop (`>= 1200px`)

- giữ full 3-column layout

## 25.2 Tablet (`768px – 1199px`)

- có thể giảm width sidebar
- calendar panel vẫn giữ visible nếu còn đủ chỗ
- nếu chật, chuyển calendar thành collapsible panel

## 25.3 Mobile (`< 768px`)

Không giữ 3 cột cùng lúc.

### Recommended Mobile Priority

1. Main chat
2. Calendar as secondary tab / drawer
3. History as drawer / sheet

### Mobile Structure

```
Header
Chat
Input composer
Bottom tabs / toggles:
- History
- Calendar
```

---

# 26. Accessibility Requirements

- Semantic headings
- Keyboard accessible history list
- Focus states visible
- Minimum touch targets ~44px
- Color contrast sufficient
- Do not rely only on color for event categories
- Input composer screen-reader friendly
- Calendar event cards readable in reduced space

---

# 27. Content & UX Guardrails

## Must Do

- Keep interactions simple
- Keep response readable
- Show only relevant context
- Preserve calm tone
- Let user stay oriented across history + current chat + calendar

## Must Avoid

- turning page into analytics dashboard
- too many charts
- too many filters
- noisy floating widgets
- fake metrics
- AI-overclaiming
- too much decorative UI

---

# 28. Design Tokens

## Colors

```
--fm-bg-page: #F5F7FC;
--fm-surface: #FFFFFF;
--fm-border: #E7EAF3;
--fm-text-primary: #191C2B;
--fm-text-secondary: #667085;
--fm-text-muted: #98A2B3;

--fm-purple: #7C3AED;
--fm-purple-soft: #EEE9FF;
--fm-purple-light: #F5F1FF;

--fm-green-soft: #E7F7F1;
--fm-blue-soft: #EAF2FF;
--fm-pink-soft: #FCEEF6;
--fm-orange-soft: #FFF3E8;
```

## Radius

```
--radius-page: 28px;
--radius-panel: 24px;
--radius-card: 18px;
--radius-pill: 999px;
```

## Shadow

```
--shadow-soft: 0 10px 30px rgba(31, 41, 55, 0.06);
```

---

# 29. Typography

## Recommended Font

- Plus Jakarta Sans
- Inter
- Manrope

## Typography Hierarchy

|Element|Size|Weight|
|---|---|---|
|Page title|24–28px|700|
|Panel title|18–20px|600–700|
|Body text|15–16px|400–500|
|Small labels|11–12px|600|
|Event title|14–16px|600|
|Meta text|12–13px|400–500|

---

# 30. Suggested Component Structure

```
AskFutureMePage
├── AppHeader
├── HistorySidebar
│   ├── SidebarHeader
│   ├── HistorySearch
│   └── HistoryList
│       └── HistoryListItem
│
├── MainChatPanel
│   ├── ChatHeader
│   ├── ConversationThread
│   │   ├── UserMessage
│   │   ├── AssistantMessage
│   │   ├── RelevantContextCard
│   │   └── SuggestionChips
│   └── ChatComposer
│
└── CalendarPanel
    ├── CalendarHeader
    ├── AgendaSection
    ├── DeadlineSection
    └── SummaryCard
```

---

# 31. Example Screen Copy

## Left Sidebar

```
History

Today
Should I join the hackathon?
Can I take this freelance project?

Yesterday
Should I skip the meetup?
Review competition submission
```

## Main Chat Header

```
Future Me
Your context-aware decision companion
```

## User Message

```
Should I join a hackathon when my project deadline is so close?
```

## Future Me Response

```
Let’s look at this in the context of your current priorities.
```

## Relevant Context

```
Active goal        Complete project MVP
Deadline           In 3 days (Fri, Oct 27)
Preference         Morning deep work
Upcoming events    2 meetings today
```

## Response Body

```
Joining the hackathon could be a great learning opportunity,
but it may reduce your available time for the MVP.
We can compare the trade-offs.
```

## Suggestion Chips

```
Explore options
Understand trade-offs
Check buffer time
```

## Input Placeholder

```
Ask anything about your decisions...
```

## Calendar Panel

```
THURSDAY
October 24, 2024

09:00  Deep Work — Project MVP
12:30  Lunch with Team
15:00  Product Review
18:30  Gym

TOMORROW · OCT 25
10:00  Client Review
14:00  Team Sync

FRIDAY · OCT 26
23:59  MVP Deadline
```

---

# 32. Acceptance Criteria

Trang được xem là đạt khi:

## Layout

- Có 3 cột rõ ràng
- Main chat ở giữa là trọng tâm
- Left sidebar nhỏ hơn main chat
- Right calendar luôn visible trên desktop

## UX

- User có thể mở lại thread cũ từ sidebar
- User có thể tiếp tục conversation dễ dàng
- User có thể nhìn lịch mà không rời trang
- Input composer luôn rõ ràng

## Product Understanding

- Người dùng cảm nhận được Future Me là decision companion
- Context card giúp phân biệt với chatbot thông thường
- Calendar panel giúp tăng cảm giác awareness thật

## Visual

- UI sạch, nhẹ, không rối
- Không biến thành dashboard analytics phức tạp
- Không có quá nhiều widget không cần thiết

---

# 33. Final Design Principle

> **Ask Future Me should feel like a calm decision workspace: your past questions on the left, your current thinking in the center, and your real-life schedule on the right.**

---

Nếu bạn muốn, ở tin nhắn tiếp theo mình có thể làm tiếp cho bạn một bản **“developer handoff spec” ngắn hơn, rất thực dụng**, kiểu:

- layout grid,
- spacing,
- component props,
- state,
- responsive rules,

để quăng thẳng cho **Hermes / frontend coding agent**.