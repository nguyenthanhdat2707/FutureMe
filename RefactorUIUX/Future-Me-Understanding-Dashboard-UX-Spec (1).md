# Future Me — What Future Me Understands

## Thiết kế đã chốt

Trang là một **personal AI dashboard** nền sáng, card trắng thoáng, viền mảnh và chữ dễ đọc. Biểu đồ đầu tiên là **line chart bốn đường** cho Goals, Commitments, Preferences và Decisions. Biểu đồ lớn thứ hai là **streamgraph** về Focus Patterns. Giữa chúng có một biểu đồ nhỏ dạng thanh ngang và một AI insight card bằng chữ. Tối đa **hai chart lớn + một chart nhỏ**.

Tài liệu này đủ để AI dựng bố cục mà không cần nhận lại các ảnh tham khảo. Các số trong bản xem trước chỉ là dữ liệu minh họa, không phải dữ liệu Future Me thực tế.

## 1. Bố cục trang từ trên xuống

1. **Header:** “What Future Me Understands”, mô tả một dòng, trạng thái sync và lần cập nhật gần nhất.
2. **Ba thẻ tổng quan nhỏ:** Active Goals, Commitments, Preferences. Mỗi thẻ có số hiện tại và một nhãn ngắn; đây là text/KPI, không phải ba chart khác.
3. **Understanding Evolution — line chart lớn:** bốn đường cùng một trục thời gian.
4. **Hai card cạnh nhau:** bên trái **Context by Category** (chart nhỏ bốn thanh ngang), bên phải **What Future Me Learned** (AI insight bằng chữ).
5. **Your Focus Patterns — streamgraph lớn:** dải màu chảy mềm theo thời gian, có điều kiện dữ liệu.
6. **Your Personal Context:** các khối nội dung Active Goals, Active Commitments, Preferences, Recent Decisions có thể mở xem chi tiết.
7. **Calendar Overview / Data Sources:** trạng thái kết nối, lần đồng bộ, lịch sắp tới.

Trên mobile, các card xếp một cột theo đúng thứ tự này; legend xuống dưới chart, không tạo cuộn ngang.

## 2. Chart lớn thứ nhất: Understanding Evolution

**Loại chart: multi-series line chart — bốn đường độc lập.** Trục X là thời gian; trục Y là **số bản ghi ngữ cảnh đang hợp lệ** tại từng thời điểm. Bốn đường: **Goals**, **Commitments**, **Preferences**, **Decisions**. Người dùng nhìn được nhóm nào đã tăng, đứng yên hoặc giảm. Đây là line graph, **không phải streamgraph và không tô thành bốn dải diện tích**.

### Mô tả hình thức

Biểu đồ nằm trong một card rộng và thấp vừa phải. Nền trắng, lưới ngang rất mảnh và nhạt. Bốn đường có màu phân biệt nhưng dịu; nét mảnh khoảng 2–2,5px, đầu và khúc nối tròn. Đường được nội suy mượt vừa đủ để bớt thô, nhưng vẫn đi qua đúng giá trị tại từng mốc và **không tạo đỉnh giả**. Bình thường chỉ hiện điểm nhấn ở điểm cuối hoặc mốc đang được chọn, không rải chấm ở mọi mẫu. Không bóng đổ dày, không gradient rực, không hiệu ứng 3D.

Legend nhỏ nằm trên hoặc ngay dưới chart; nhãn chữ luôn đi cùng màu. Hover, focus hoặc chạm một ngày sẽ hiện **một đường chỉ dẫn dọc mảnh**, bốn chấm tại cùng ngày và một tooltip chung: số lượng của cả bốn nhóm, thay đổi so với mốc trước và những bản ghi mới/hết hiệu lực. Có thể click legend để tạm ẩn một đường. Nếu chỉ có một hoặc hai mốc dữ liệu, dùng đoạn thẳng/điểm rõ ràng thay vì tạo đường cong giả.

**Cảm giác mong muốn:** hiện đại, sạch, thanh thoát và dễ đọc, giống giao diện analytics tinh gọn. Chart hỗ trợ nội dung, không chiếm toàn bộ sự chú ý của trang.

## 3. Chart nhỏ: Context by Category

Bốn **thanh ngang ngắn** thể hiện số lượng hiện tại của Goals, Commitments, Preferences, Decisions. Giá trị số đứng cạnh nhãn; màu đồng bộ với bốn đường line chart. Chart này trả lời “AI hiện có bao nhiêu thông tin trong mỗi nhóm?”, còn line chart trả lời “chúng thay đổi ra sao theo thời gian?”. Không ghi phần trăm “AI hiểu bạn 75%” khi chưa có định nghĩa và mẫu số.

Nếu thẻ tổng quan phía trên và bốn thanh này lặp lại quá nhiều, có thể giữ ba thẻ cho việc đọc lướt và đặt chart nhỏ trong card có thêm nhóm Decisions; không tạo thêm donut, gauge hay biểu đồ thứ tư.

## 4. AI insight: What Future Me Learned

Một card chữ bên cạnh Context by Category: 1–3 ý cụ thể mà AI vừa học được, điều gì đổi trạng thái hoặc đã hết hiệu lực. Mỗi ý có nguồn và trạng thái như **User confirmed**, **From Calendar**, hoặc **Inferred**. Người dùng có thể mở bản ghi gốc và sửa một suy luận sai nếu chức năng đó đã tồn tại.

Một line chart giảm số lượng vì cam kết hết hạn không có nghĩa Future Me đã “quên” người dùng; insight giải thích nguyên nhân thay đổi.

## 5. Chart lớn thứ hai: Your Focus Patterns

**Loại chart: layered streamgraph / smooth flowing area chart.** Đây là chỗ áp dụng hình sóng mềm mại: một hoặc nhiều dải xanh lam và xanh ngọc chảy ngang qua thời gian, phình ra và thu lại quanh đường nền trung tâm. Mép dải cong tròn, chuyển tiếp liên tục, không có góc nhọn, đường răng cưa hay cột đứng tách rời. Lớp ngoài nhạt/bán trong suốt, lớp trong rõ hơn; nền card sạch và mốc thời gian thật nhẹ.

Độ dày phải biểu diễn **phút tập trung đã hoàn thành**, không phải chỉ là hình trang trí. Nếu có nhiều lớp, mỗi lớp cần một ý nghĩa dữ liệu rõ và legend tương ứng; đừng nhân đôi cùng một số thành hai lớp để làm cho đồ thị dày hơn. Mức tập trung tự đánh giá 1–5, nếu có, cần nhãn/thang đo riêng chứ không ẩn trong độ đậm màu.

Chỉ render streamgraph khi đã ghi nhận focus session thực tế. Một lịch hẹn “Deep Work 4 hours” chỉ là kế hoạch. Khi thiếu dữ liệu, giữ card ở dạng empty state ngắn: “Record a focus session to see your patterns”, không hiển thị đường sóng giả.

## 6. Hành vi và giới hạn dữ liệu

- Cả hai chart lớn dùng dữ liệu thật; mockup phải gắn nhãn **“Minh họa · dữ liệu giả”**.
- Line chart tính snapshot theo thời điểm; commitment hết hạn có thể khiến đường giảm. Tooltip chỉ rõ việc gì đã xảy ra.
- Focus chart dùng thời gian thực sự hoàn thành. Không suy ra năng suất hoặc kết quả công việc từ thời lượng đơn thuần.
- Chart có nhãn, legend, tooltip dùng được bằng chuột, cảm ứng và bàn phím; màu không phải cách duy nhất để phân biệt series.
- Khi chưa có lịch sử thay đổi, hiển thị empty state của line chart và context hiện tại. Không suy ra quá khứ từ một snapshot hiện tại.
- Loading và lỗi đồng bộ có trạng thái riêng; không dùng số 0 để thay cho “chưa tải được”.

## 7. Responsive specification

### Breakpoints dùng chung

| Viewport | Layout |
| --- | --- |
| Từ 1024px | Desktop dashboard đầy đủ. |
| 768–1023px | Tablet dashboard gọn hơn, vẫn giữ thứ bậc chart. |
| 480–767px | Mobile một cột. |
| 320–479px | Compact mobile; ưu tiên chart và nội dung chính. |

### Desktop: từ 1024px

- Header nằm cùng hàng với sync status và last updated.
- Ba KPI Active Goals, Commitments, Preferences nằm cùng một hàng.
- Understanding Evolution line chart chiếm toàn bộ chiều rộng.
- Context by Category và What Future Me Learned nằm cạnh nhau.
- Focus Patterns streamgraph chiếm toàn bộ chiều rộng.
- Personal Context dùng lưới card hai hoặc bốn cột tùy chiều rộng, sau đó đến Calendar Overview.

### Tablet: 768–1023px

- Header xếp title và sync status thành hai hàng khi không đủ chỗ.
- Ba KPI vẫn nằm một hàng nếu nhãn không bị cắt; nếu không thì card thứ ba xuống hàng sau.
- Understanding Evolution vẫn full width.
- Context by Category và What Future Me Learned giữ hai cột khi mỗi card còn đủ tối thiểu 320px; nếu không thì xếp dọc.
- Focus Patterns giữ full width.
- Personal Context chuyển thành lưới hai cột.

### Mobile: 480–767px

- Toàn bộ trang xếp một cột theo thứ tự: header → KPI → line chart → Context by Category → AI insight → Focus Patterns → Personal Context → Calendar/Data Sources.
- KPI dùng ba card nhỏ cùng hàng nếu chiều rộng mỗi card vẫn đọc được; nếu không thì chuyển thành hai hàng.
- Line chart rộng hết card, cao khoảng 220–250px. Chỉ giữ tối đa bốn mốc thời gian trên trục X. Legend xuống dưới chart và được phép wrap thành hai hàng.
- Tooltip line chart mở khi tap một mốc dữ liệu và hiển thị trong popover/bottom sheet; không yêu cầu hover.
- Context by Category vẫn dùng bốn thanh ngang. Nhãn ở trái, số ở phải; thanh chiếm phần giữa.
- Focus streamgraph cao khoảng 180–220px và chỉ hiển thị 4–5 mốc thời gian. Nếu chưa có focus session, empty state thay thế toàn bộ chart.
- Personal Context dùng accordion; mỗi lần mở một section để trang không quá dài.

### Compact mobile: 320–479px

- Header chỉ giữ title, một supporting text ngắn và sync status. Last updated chuyển vào detail/status row.
- KPI chuyển thành một cột hoặc lưới hai cột; không để ba card bị quá hẹp.
- Line chart ưu tiên 7-day view. Các range 30 days và 90 days đổi bằng control, không nhồi nhiều label.
- Legend dùng label đầy đủ nhưng có thể xếp thành nhiều hàng. Không đổi thành icon-only.
- AI insight hiển thị tối đa hai ý; dùng View more để mở ý thứ ba.
- Calendar Overview rút còn trạng thái sync và sự kiện sắp tới gần nhất; chi tiết mở trong accordion.

### Responsive interaction rules

- Không có cuộn ngang toàn trang.
- Chart hỗ trợ mouse, keyboard và touch. Tap giữ tooltip mở cho tới khi người dùng đóng hoặc chọn mốc khác.
- Khi legend series được tắt, line, marker và tooltip row của series đó cùng ẩn.
- Bất kỳ hành động Edit context, Correct hoặc Remove đều mở UI phù hợp với mobile, ưu tiên bottom sheet thay vì modal nhỏ.
- Không hiển thị streamgraph demo khi thiếu focus data. Không diễn giải focus quality chỉ từ calendar event.

## 8. Acceptance criteria responsive

- [ ] Layout không tràn ngang tại 320px, 480px, 768px, 1024px.
- [ ] Line chart giữ được trục, legend, tooltip và bốn series tại mọi breakpoint.
- [ ] Tại mobile, Context by Category và AI insight xếp dọc; chart focus có empty state khi thiếu session thực tế.
- [ ] Tại mobile, Personal Context dùng accordion và không khiến trang phải render toàn bộ nội dung dài cùng lúc.
- [ ] Tất cả thao tác chart và provenance hoạt động bằng touch và keyboard.

## 9. Brief để dán cho AI triển khai

> Thiết kế lại trang **What Future Me Understands** dưới dạng personal AI dashboard nền sáng, card trắng viền mảnh, sạch và thoáng. Desktop: ba KPI cùng hàng, line chart Understanding Evolution full width, Context by Category và AI insight cạnh nhau, Focus Patterns full width. Tablet: giữ chart full width và chuyển các card thành lưới hai cột khi đủ chỗ. Mobile: xếp một cột theo thứ tự KPI → line chart → Context by Category → AI insight → Focus Patterns → Personal Context → Calendar Overview; line chart cao 220–250px, legend wrap xuống dưới, tooltip mở bằng tap; focus streamgraph cao 180–220px và chỉ hiện khi có focus session thực tế. Personal Context dùng accordion trên mobile. Understanding Evolution là multi-series line chart gồm bốn đường Goals, Commitments, Preferences, Decisions. Focus Patterns là layered streamgraph với các dải xanh mềm theo phút tập trung đã hoàn thành. Tổng cộng tối đa hai chart lớn và một chart nhỏ. Thiết kế loading, empty, error và provenance cho cả desktop/tablet/mobile; không thay đổi business logic hoặc biến dữ liệu demo thành dữ liệu thật.

## Tham khảo thuật ngữ

- [D3 Lines](https://d3js.org/d3-shape/line) và [D3 Curves](https://d3js.org/d3-shape/curve): line chart và phép nối điểm thành đường mượt.
- [D3 Stacks](https://d3js.org/d3-shape/stack): cách tạo các lớp streamgraph cho chart Focus.
