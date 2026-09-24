# Future Me — Dashboard Page Design Specification

## 1. Page identity

Tên trang: **Dashboard**  
Route đề xuất: **/dashboard**  
Người dùng: người đã đăng nhập Future Me.

Dashboard là trang vận hành hằng ngày: xem lịch, deadline, phân bổ thời gian và các sự kiện cần xử lý. Trang Home mới là trang giới thiệu sản phẩm; Dashboard không dùng hero marketing, testimonial hoặc CTA bán sản phẩm.

Sau khi người dùng đăng nhập, Dashboard là trang mặc định. Ask Future Me nằm ở khu vực chat/decision support riêng.

## 2. Mục tiêu người dùng

Dashboard cần trả lời nhanh:

1. Hôm nay và tuần này có lịch gì?
2. Việc nào cần ưu tiên?
3. Thời gian đang được dành cho deep work, meetings và recovery ra sao?
4. Cuộc họp nào cần tham gia ngay và event nào cần duyệt?

## 3. Visual system

| Thành phần | Quy tắc |
| --- | --- |
| Theme | Light theme, nền trang #F8F9FA, card trắng. |
| Accent | Tím là màu nhận diện, từ #7C3AED đến #A78BFA. |
| Card | Bo góc 20–24px, viền mảnh, shadow rất nhẹ. |
| Glass | Chỉ dùng cho event pill trong calendar và điểm nhấn nhỏ. |
| Màu trạng thái | Xanh lá cho Join, vàng/cam cho deadline sắp đến, đỏ cho quá hạn hoặc rất gấp. |
| Typography | Heading rõ ràng, mô tả ngắn, mọi số có nhãn và đơn vị. |

## 4. Layout

Thứ tự từ trên xuống:

1. Top bar.
2. Dashboard header và date-range control.
3. Weekly Gantt Calendar chiếm toàn bộ chiều rộng.
4. Insight grid ba card: Deadlines, Task Type, Upcoming & Suggestions.

Desktop dùng ba card ngang nhau. Tablet dùng hai cột. Mobile dùng một cột.

## 5. Top bar

- Left: Future Me logo.
- Navigation: Dashboard, Ask Future Me, Decisions, Understanding.
- Dashboard là item active.
- Right: avatar và profile menu.

Không đưa navigation của landing page vào Dashboard.

## 6. Dashboard header

- Eyebrow: YOUR WEEK AT A GLANCE.
- Heading: Plan your week with more clarity.
- Supporting text: Your schedule, urgent work and the context Future Me has learned.
- Bên phải: date-range control, ví dụ 22–28 September 2026.

Đổi date range phải cập nhật calendar, deadlines, Task Type và suggestions theo cùng phạm vi ngày.

## 7. Weekly Gantt Calendar

### Mục đích

Calendar là vùng chính của Dashboard. Nó cho người dùng thấy lịch tuần và focus blocks trong cùng một bối cảnh.

### Card header

- Title: Your week at a glance.
- Supporting text: Calendar events and protected focus time.
- Sync state: Synced with Calendar hoặc trạng thái lỗi.

### Grid

- Cột đầu hiển thị các mốc giờ: 09:00, 11:00, 14:00, 17:00.
- Bảy cột còn lại hiển thị Mon–Sun và ngày tương ứng.
- Event nằm đúng ngày và duration trong lưới.

### Event pill

Mỗi pill gồm:

1. Icon tròn nhỏ.
2. Event title.
3. Badge nhỏ: Approved, Focus, Join hoặc Personal.

| Event | Màu | Badge |
| --- | --- | --- |
| Team Standup | Xanh lam | Approved |
| Deep Work — Future Me MVP | Tím | Focus |
| CloudThinker sync | Xanh ngọc | Join |
| Run & reflect | Tím | Personal |

Click event mở detail panel hoặc modal có title, thời gian, source, RSVP và meeting link khi có.

Không dùng calendar event để khẳng định người dùng đã hoàn thành một focus session.

## 8. Insight Grid

### 8.1 Deadlines

Card trả lời: việc nào cần xử lý trước?

Hiển thị tối đa ba task gần deadline hoặc priority cao nhất:

- Ngày/tháng ở bên trái.
- Task title.
- Dòng thời gian tương đối: Due in 2 days.
- Priority badge High hoặc Medium.

| Trạng thái | Màu |
| --- | --- |
| Overdue hoặc còn dưới 24 giờ | Đỏ |
| Còn 1–3 ngày | Cam/vàng |
| Còn trên 3 ngày | Trung tính hoặc vàng nhẹ |

Cuối card có View all tasks →. Không hiển thị task hoàn thành trong danh sách chính.

### 8.2 Task Type

Card trả lời: tuần này thời gian của mình đang nghiêng về loại công việc nào?

Task Type đo **planned-time allocation**, không phải năng lượng hoặc khả năng hoàn thành deadline.

Card có:

- Title: Task type.
- Supporting text: How your planned week is distributed.
- Dropdown: Today, This week, Next week.

Vùng bubble luôn có đúng ba bubble:

| Bubble | Nội dung | Style |
| --- | --- | --- |
| Trung tâm | Category lớn nhất, ví dụ 68% Deep work | Tím đậm gần đen, lớn nhất, nằm trên. |
| Trên phải | Category thứ hai, ví dụ 22% Meetings | Tím nhạt. |
| Dưới trái | Category thứ ba, ví dụ 10% Recovery | Tím rất nhạt. |

Footer dưới bubble có đường chia và ba chỉ số: 16h Deep work, 5h Meetings, 2h Recovery.

Tỷ lệ được tính từ tổng duration của event hoặc time block đã có category trong phạm vi ngày đã chọn. Nếu chưa đủ dữ liệu, hiển thị:

> Add scheduled focus blocks or connect your calendar to see your time distribution.

Không dùng donut hoặc pie chart. Bubble scale theo relative scaling có giới hạn để category nhỏ vẫn đọc được:

- Bubble chính: đường kính 120–150px.
- Bubble phụ lớn: 70–90px.
- Bubble phụ nhỏ: 48–60px.

Hover/tap bubble hiển thị category, tỷ lệ, số giờ và các event liên quan. Click bubble có thể highlight event cùng category trong calendar.

### 8.3 Upcoming & Suggestions

Card có hai phần.

**Upcoming meeting**

- Platform icon: Google Meet, Zoom hoặc Teams.
- Meeting title.
- Thời gian tương đối: Starts in 15 min.
- Join now chỉ hiện khi meeting link tồn tại.

**Smart suggestion**

- Event title và thời gian.
- Source: Detected from email.
- Commitment score, ví dụ 73%.
- Accept và Deny.

Commitment là mức độ phù hợp hoặc khả năng user tham gia event, dựa trên calendar, deadline và preference đã xác nhận. Detail view cần giải thích ngắn vì sao score này được đưa ra.

Accept tạo event trên calendar. Deny bỏ suggestion. Không thay đổi calendar trước khi user chọn action.

## 9. Responsive behavior

| Viewport | Calendar | Insight grid |
| --- | --- | --- |
| Từ 1024px | Full seven-day Gantt | Ba cột |
| 768–1023px | Full seven-day Gantt, padding gọn hơn | Hai cột; Upcoming & Suggestions full width ở hàng hai |
| 480–767px | Daily agenda với Mon–Sun day switcher | Một cột |
| 320–479px | Daily agenda rút metadata; detail bằng bottom sheet | Một cột; Task Type footer thành ba hàng |

### Mobile details

- Không nén seven-day Gantt vào màn hình nhỏ.
- Daily agenda chỉ hiện event title, time và status ngắn; metadata còn lại mở trong bottom sheet.
- Deadlines hiển thị hai item đầu và View all tasks.
- Join now full width.
- Accept và Deny có cùng chiều rộng.
- Không có cuộn ngang toàn trang.

## 10. State and interaction rules

| Khu vực | Loading | Empty | Error |
| --- | --- | --- | --- |
| Calendar | Skeleton giữ chiều cao grid | No events in this range | Calendar could not sync |
| Deadlines | Card skeleton | No urgent deadlines this week | Tasks could not load |
| Task Type | Bubble skeleton | Empty state mô tả cách tạo dữ liệu | Allocation could not load |
| Suggestions | Card skeleton | No new suggestions | Suggestions could not load |

- Calendar event, bubble và action phải dùng được bằng mouse, keyboard và touch.
- Màu không phải cách duy nhất để biểu đạt priority hoặc status.
- Mobile event detail và action phụ dùng bottom sheet.
- Không dùng giá trị 0 thay cho loading hoặc error.

## 11. Component map

- DashboardPage
  - TopBar
  - DashboardHeader
  - GanttCalendar
  - DashboardInsightGrid
    - DeadlinesCard
    - TaskTypeBubbleCard
    - UpcomingAndSuggestionsCard

| Component | Data cần có |
| --- | --- |
| GanttCalendar | range, events, syncStatus, onEventOpen |
| DeadlinesCard | urgentTasks, onViewAll |
| TaskTypeBubbleCard | range, allocationByCategory, onRangeChange, onCategoryOpen |
| UpcomingAndSuggestionsCard | upcomingMeeting, suggestions, onJoin, onAccept, onDeny |

## 12. Acceptance criteria

- [ ] Route và navigation gọi trang này là Dashboard.
- [ ] Calendar là vùng lớn nhất trên desktop/tablet.
- [ ] Task Type có đúng ba bubble và footer ba chỉ số.
- [ ] Task Type dùng duration theo category, không phải energy score.
- [ ] Join now chỉ hiện khi meeting link có mặt.
- [ ] Accept/Deny không tạo hoặc xóa calendar event trước khi user chọn.
- [ ] Mobile dùng daily agenda và một cột insight cards.
- [ ] Không có cuộn ngang toàn trang ở 320px, 480px, 768px và 1024px.

## 13. Prompt cho AI triển khai

> Build the authenticated Future Me Dashboard at /dashboard. It is the daily operating page after login, not the marketing Home page. Use a light, spacious UI with a full-width weekly Gantt calendar as the primary surface. Under it, add Deadlines, Task Type, and Upcoming & Suggestions. Desktop uses three columns, tablet uses two columns, and mobile uses a daily agenda plus one-column cards. Task Type uses exactly three overlapping bubbles for planned-time allocation: a dark-purple center bubble for the largest category and two pale-purple bubbles for the next categories, with an hours summary below. Use real calendar/task data, clear loading/empty/error states, and the interactions described in this document.
