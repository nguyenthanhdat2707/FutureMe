# Future Me — Landing Page Hero Section

**UI/UX Design Specification v1.0**

---

## 1. Overview

### Product
**Future Me**

### Screen
Landing Page — Hero Section

### Supported Viewports
- Desktop
- Tablet
- Mobile

### Design Direction
Modern, minimal, soft futuristic, premium AI companion.

### Visual Reference
SOMA landing page.

> SOMA được sử dụng làm reference cho composition, visual balance và cách xử lý split hero. Future Me không sao chép visual identity hoặc nội dung của SOMA.

### Primary Objective

Hero Section phải giúp một người chưa từng biết Future Me hiểu được trong vài giây đầu:

1. **Future Me giúp tôi giải quyết vấn đề gì?**
2. **Future Me khác gì với việc mở ChatGPT và đặt câu hỏi?**
3. **Tôi cần bấm vào đâu để bắt đầu?**

---

# 2. Product Positioning

## 2.1 Core Idea

### Your Future Starts With Today's Decisions

Future Me không phải task manager, productivity tracker hoặc một chatbot chỉ phản hồi từng câu hỏi riêng lẻ.

Giá trị cốt lõi của Future Me nằm ở khả năng sử dụng **personal context** như:

- Goals
- Commitments
- Schedule
- Priorities
- Preferences
- Previous decisions
- Relevant history

để giúp người dùng:

- hiểu tình huống hiện tại,
- khám phá các lựa chọn,
- nhận diện trade-off,
- và đưa ra quyết định phù hợp hơn với điều họ đang hướng tới.

Future Me **hỗ trợ quá trình ra quyết định**, không quyết định thay người dùng.

---

# 3. Experience Principles

Hero Section cần truyền tải bốn cảm giác chính.

## 3.1 Personal

AI hiểu những điều người dùng đang theo đuổi và có thể sử dụng bối cảnh liên quan trong quá trình hỗ trợ.

Không tạo cảm giác Future Me là một chatbot generic.

---

## 3.2 Intelligent

Future Me không chỉ trả lời prompt hiện tại.

Nó có thể kết nối câu hỏi với những thông tin đã được người dùng cung cấp hoặc đồng bộ trước đó.

---

## 3.3 Calm

Trải nghiệm không được tạo cảm giác:

- bị thúc ép,
- bị đánh giá,
- phải tối ưu năng suất bằng mọi giá,
- hoặc bị AI kiểm soát quyết định.

Tone tổng thể cần nhẹ, rõ ràng và hỗ trợ.

---

## 3.4 Forward-looking

Mỗi quyết định hiện tại đều có thể ảnh hưởng đến những mục tiêu mà người dùng đang xây dựng.

Hero cần tạo cảm giác về:

- direction,
- progression,
- exploration,
- future possibilities.

---

# 4. Visual Direction

## 4.1 Main Visual Style

### Soft 3D Landscape

Sử dụng abstract 3D environment mang cảm giác:

- tương lai,
- chuyển động,
- exploration,
- chiều sâu,
- nhưng vẫn nhẹ và tối giản.

Có thể sử dụng:

- smooth terrain,
- abstract pathways,
- soft floating shapes,
- translucent surfaces,
- light blue atmosphere,
- lavender/pink accents.

---

## 4.2 Floating UI Elements

Các UI card nhỏ có thể xuất hiện phía trên 3D background để kết nối phần visual với khả năng thực tế của sản phẩm.

Floating UI không được trở thành thành phần chính.

Main Product Preview vẫn phải là điểm tập trung.

---

## 4.3 Avoid

Không sử dụng:

- Robot humanoid
- Glowing AI brain
- Neural network stock illustration
- Generic AI icons
- Futuristic HUD quá phức tạp
- Cyberpunk visual
- Dashboard screenshot đầy KPI
- Fake analytics
- Fake user count
- Fake AI accuracy percentage

Future Me cần trông giống một **personal decision companion**, không phải một AI infrastructure product.

---

# 5. Hero Architecture

Hero sử dụng cấu trúc **Split Layout**.

```text
┌──────────────────────────────────────────────────────────────┐
│ future me.             How it works  Features  About  Sign in│
│                                                              │
│ ┌─────────────────────────┬────────────────────────────────┐ │
│ │                         │                                │ │
│ │ YOUR AI DECISION        │                                │ │
│ │ COMPANION               │      3D VISUAL LANDSCAPE      │ │
│ │                         │                                │ │
│ │ Make decisions with     │      PRODUCT PREVIEW          │ │
│ │ your future in mind.    │                                │ │
│ │                         │      FLOATING CONTEXT CARDS    │ │
│ │ Supporting copy         │                                │ │
│ │                         │                                │ │
│ │ [ Get Started ↗ ]       │                                │ │
│ │ See how it works        │                                │ │
│ │                         │                                │ │
│ │ Your future is yours    │                                │ │
│ │ to shape.               │                                │ │
│ │                         │                                │ │
│ │ ─────────────────────   │                                │ │
│ │ More than an answer...  │                                │ │
│ └─────────────────────────┴────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Đây là **layout reference**, không phải pixel-perfect mockup.

---

# 6. Desktop Layout Specifications

| Property | Specification |
|---|---|
| Outer background | `#E5EDFC` |
| Main container | `#FFFFFF` |
| Container max-width | `1440px` |
| Outer margin | `16–24px` |
| Container border-radius | `40px` |
| Hero minimum height | `740px` |
| Left column | `47%` |
| Right column | `53%` |
| Column gap | `20px` |
| Left padding | `40–48px` |
| Right panel border-radius | `32px` |
| Right panel background | Light blue / lavender gradient |

### Layout Rule

Không chia `50 / 50` một cách máy móc.

Right Visual cần nhiều không gian hơn vì chứa:

- 3D background,
- conversation preview,
- context cards,
- floating UI.

---

# 7. Navigation

Navigation nằm phía trên Hero và sử dụng thiết kế tối giản dạng pill/lightweight navigation.

## 7.1 Logo

Wordmark:

```text
future me.
```

### Typography

| Property | Value |
|---|---|
| Font | Plus Jakarta Sans / Manrope |
| Font size | `26–30px` |
| Font weight | `600–700` |
| Letter spacing | `-1px` |
| Color | `#7C3AED` |

Không thêm slogan bên cạnh logo.

---

## 7.2 Navigation Items

```text
How it works
Features
About
Sign in ↗
```

### Navigation Behavior

| Item | Destination / Behavior |
|---|---|
| Logo | `/` |
| How it works | Smooth scroll → How It Works section |
| Features | Smooth scroll → Features section |
| About | Smooth scroll → About section |
| Sign in | Authentication flow |
| Go to Dashboard | `/dashboard`, chỉ hiển thị khi authenticated |

### Authentication State

#### Anonymous

```text
How it works
Features
About
Sign in ↗
```

#### Authenticated

```text
How it works
Features
About
Go to Dashboard ↗
```

Không cần hiển thị `Dashboard` hoặc `Decisions` trong public navigation trước khi đăng nhập.

---

# 8. Left Section — Messaging & Conversion

Left section là khu vực quan trọng nhất của Hero.

Người dùng phải hiểu sản phẩm trước khi bị thu hút hoàn toàn bởi visual.

Content hierarchy:

```text
Eyebrow
↓
Headline
↓
Supporting description
↓
Primary CTA + Secondary CTA
↓
Microcopy
↓
Bottom information card
```

---

# 9. Eyebrow

### Content

```text
YOUR AI DECISION COMPANION
```

### Style

| Property | Value |
|---|---|
| Background | `#F3EAFF` |
| Text color | `#7C3AED` |
| Font size | `11px` |
| Letter spacing | `0.8px` |
| Border radius | `100px` |
| Padding | `8px 12px` |
| Font weight | `600` |

### Purpose

Badge chỉ dùng để định vị category của sản phẩm.

Không làm badge nổi bật hơn headline.

---

# 10. Main Headline

## Primary Copy

```text
Make decisions with your future in mind.
```

Visual emphasis có thể đặt vào:

```text
your future
```

Ví dụ layout:

```text
Make decisions with
your future
in mind.
```

Trong implementation, đây vẫn phải là **một `<h1>` duy nhất**.

Không tạo ba heading độc lập chỉ để xuống dòng.

---

## Typography

| Property | Desktop | Mobile |
|---|---:|---:|
| Font size | `56–64px` | `38–42px` |
| Font weight | `650–700` | `700` |
| Line height | `1.1` | `1.15` |
| Letter spacing | `-2px` | `-1.2px` |
| Max width | `540px` | `100%` |

### Highlight

Default text:

```css
color: #17171C;
```

Highlighted phrase:

```css
color: #7C3AED;
```

Không sử dụng gradient trên toàn bộ headline.

Chỉ highlight một cụm quan trọng.

---

# 11. Supporting Description

## Final Copy

> Future Me brings your goals, commitments, and preferences into one conversation, helping you explore your options and make decisions with clarity.

### Purpose

Đoạn này phải giải thích cơ chế khác biệt:

```text
Question
+
Personal Context
+
Decision Reasoning
=
More relevant guidance
```

Người dùng cần hiểu Future Me không chỉ nhận prompt hiện tại rồi phản hồi độc lập.

---

## Style

| Property | Value |
|---|---|
| Text color | `#666873` |
| Font size | `16px` |
| Line height | `1.6` |
| Max width | `460px` |
| Margin top | `20–24px` |

---

## Messaging Guardrail

Không sử dụng các claim như:

```text
Future Me always knows what is best for you.
```

```text
Let AI make better decisions for you.
```

```text
Never make the wrong decision again.
```

Future Me hỗ trợ reasoning và exploration.

Quyền quyết định cuối cùng vẫn thuộc về người dùng.

---

# 12. CTA Area

CTA tập trung vào **một primary action duy nhất**.

```text
[ Get Started ↗ ]

See how it works

Your future is yours to shape.
```

---

# 13. Primary CTA

## Label

```text
Get Started
```

### Visual Priority

Primary CTA phải là action nổi bật nhất trên Left Section.

Suggested style:

| Property | Value |
|---|---|
| Background | `#7C3AED` |
| Text | `#FFFFFF` |
| Border radius | `999px` |
| Height | `48–52px` |
| Horizontal padding | `22–28px` |
| Font weight | `600` |

Có thể sử dụng arrow icon:

```text
↗
```

hoặc icon tương đương từ icon library.

---

## Behavior

### User chưa đăng nhập

```text
Get Started
→ Authentication
→ Onboarding
→ Ask Future Me
```

### User đã đăng nhập nhưng chưa onboarding

```text
Get Started
→ Onboarding
→ Ask Future Me
```

### User đã hoàn tất onboarding

```text
Get Started
→ /decisions
```

---

## Intent Preservation

Nếu người dùng bắt đầu flow từ CTA Hero:

```text
Get Started
```

thì authentication/onboarding chỉ là intermediate steps.

Sau khi hoàn tất, hệ thống phải đưa người dùng về đúng intended destination:

```text
/decisions
```

Không redirect mặc định sang một dashboard không liên quan làm mất user intent.

---

# 14. Secondary CTA

## Label

```text
See how it works
```

### Behavior

```text
click
→ smooth scroll
→ How It Works section
```

Không:

- yêu cầu authentication,
- mở popup,
- redirect sang external page,
- chuyển người dùng sang flow khác.

---

# 15. CTA Microcopy

## Copy

```text
Your future is yours to shape.
```

### Purpose

Câu này củng cố product principle:

> Future Me supports decisions. It does not replace human agency.

### Style

- Font size: `12–13px`
- Color: muted gray
- Margin top: `12–16px`

---

# 16. Right Section — Experience Visualization

Right Section không phải decorative illustration đơn thuần.

Nó phải cho người dùng thấy **Future Me hoạt động khác một chatbot thông thường như thế nào**.

Cấu trúc:

```text
3D Background
    ↓
Main Conversation Preview
    ↓
Relevant Context
    ↓
Decision Exploration
    ↓
Floating Supporting Cards
```

---

# 17. Right Panel Background

## Visual Direction

Light blue / lavender gradient với abstract 3D environment.

Suggested gradient:

```css
background:
  linear-gradient(
    145deg,
    #DCE8FF 0%,
    #E9E4FF 55%,
    #F6E8FA 100%
  );
```

Có thể thêm:

- blurred light spheres,
- abstract hills,
- glass surfaces,
- soft pink accent,
- ambient shadow,
- subtle grain.

### Background Role

Background chỉ tạo mood.

Không chứa:

- product text,
- metrics,
- screenshots,
- critical UI information.

Tất cả product information phải được render bằng HTML/CSS phía trên để:

- sắc nét,
- accessible,
- responsive,
- dễ animate,
- dễ maintain.

---

# 18. Main Product Preview

Không sử dụng nguyên screenshot Dashboard.

Thay vào đó, Hero hiển thị một **mini decision conversation**.

---

## 18.1 Preview Header

```text
EXAMPLE CONVERSATION
```

Đây phải là demo content.

Không được tạo cảm giác dữ liệu này thuộc về người đang truy cập website.

---

# 19. Example Conversation

### User

```text
YOU

Should I join a hackathon when my project deadline is so close?
```

### Future Me

```text
FUTURE ME

Let's look at this in the context of your current priorities.
```

---

# 20. Relevant Context Block

```text
RELEVANT CONTEXT
```

### Example

| Context | Value |
|---|---|
| Active goal | Complete project MVP |
| Deadline | In 3 days |
| Preference | Morning deep work |

Visual treatment:

- card / glass surface,
- small icons optional,
- strong label/value distinction,
- không quá giống analytics dashboard.

---

# 21. Decision Reasoning Preview

Sau context block:

```text
We can compare the time commitment, potential benefits,
and impact on your MVP.
```

Suggested actions:

```text
Explore options
Understand trade-offs
```

Hai action này có thể là chips hoặc lightweight buttons.

Không cần thực sự interactive trong Hero nếu chỉ đóng vai trò visual demo.

---

# 22. What This Preview Must Communicate

Người dùng phải có khả năng suy ra flow sau chỉ bằng việc nhìn Hero:

```text
User asks a question
        ↓
Future Me retrieves relevant context
        ↓
Future Me connects context to the decision
        ↓
Future Me helps explore options and trade-offs
        ↓
User decides
```

Đây là điểm khác biệt quan trọng với generic chatbot.

Một chatbot thông thường thường yêu cầu người dùng tự đưa lại context vào prompt.

Future Me có thể sử dụng context đã được:

- cung cấp trước đó,
- cập nhật,
- hoặc đồng bộ,

nếu context đó liên quan đến quyết định hiện tại.

---

# 23. Floating Elements

Có thể sử dụng tối đa **2–3 floating cards**.

Không cần hiển thị cả ba nếu Main Preview đã đủ thông tin.

---

## Card A — Goals

```text
YOUR GOALS

Stay connected to what matters.
```

---

## Card B — Commitments

```text
YOUR COMMITMENTS

Make room for what comes next.
```

---

## Card C — Decisions

```text
YOUR DECISIONS

Explore paths with greater clarity.
```

---

# 24. Floating Card Rules

Cards nên:

- nhỏ hơn Main Preview,
- opacity nhẹ hơn,
- nằm ở nhiều depth level,
- có soft shadow,
- có slight glass effect,
- không che nội dung chính.

Suggested treatment:

```css
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(18px);
border: 1px solid rgba(255, 255, 255, 0.65);
box-shadow: 0 16px 50px rgba(55, 45, 95, 0.12);
```

---

# 25. Bottom-left Information Card

Reference SOMA có một content card nhỏ ở dưới Left Section.

Future Me giữ pattern này để cân bằng composition.

---

## Copy

### Heading

```text
More than an answer.
A clearer way forward.
```

### Description

```text
See how Future Me connects your context,
decisions, and next steps.
```

### Action

```text
Explore how it works →
```

---

## Interaction

```text
click
→ smooth scroll
→ How It Works
```

---

## Visual Treatment

Card có thể tách khỏi phần trên bằng divider:

```text
────────────────────────────
```

Suggested:

- divider opacity thấp,
- no heavy border,
- generous vertical spacing.

---

## Future Video Support

Nếu sau này có demo video thật:

```text
Information Card
→ Video Preview Card
```

Nhưng ở phiên bản hiện tại:

**Không hiển thị Play icon nếu chưa có video thật.**

---

# 26. Responsive Behavior

## Desktop — `>= 1024px`

```text
Left Content 47%
Right Visual 53%
```

Full Split Hero.

Right visual chiếm ưu thế nhẹ về diện tích.

---

## Tablet — `768px–1023px`

Có thể chuyển sang:

```text
Left Content
─────────────
Right Visual
```

hoặc giữ split với typography nhỏ hơn nếu viewport đủ rộng.

Ưu tiên readability hơn giữ layout desktop bằng mọi giá.

---

# 27. Mobile Layout

Mobile sử dụng single-column flow.

Recommended order:

```text
Logo + Navigation Trigger
↓
Eyebrow
↓
Headline
↓
Description
↓
Primary CTA
↓
Secondary CTA
↓
Microcopy
↓
Product Preview
↓
Bottom Information Card
```

---

## Mobile Specifications

### Hero

```css
padding: 20px;
border-radius: 24px;
```

### Headline

```text
38–42px
line-height: 1.15
```

### Right Panel

- Full width
- Minimum height: `420–520px`
- Radius: `24px`

### Floating Elements

Mobile chỉ nên giữ:

- Main Preview
- tối đa 1 floating card

để tránh visual overload.

---

# 28. Motion & Interaction

Motion phải nhẹ và calm.

## Allowed

### Hero Load

- subtle fade,
- slight translate-up,
- staggered content entrance.

Example:

```text
Eyebrow → 0ms
Headline → 80ms
Description → 160ms
CTA → 240ms
Visual → 160ms
```

---

## Floating Cards

Có thể sử dụng slow floating movement:

```text
translateY: ±4–8px
duration: 5–8s
```

Không dùng animation liên tục quá mạnh.

---

## Hover

### Primary CTA

- slight lift,
- subtle shadow increase.

### Navigation

- background tint,
- text color transition.

### Preview Cards

- minimal elevation change.

---

## Accessibility

Nếu:

```css
@media (prefers-reduced-motion: reduce)
```

thì disable toàn bộ:

- floating loops,
- parallax,
- non-essential entrance movement.

---

# 29. Accessibility Requirements

Hero phải đạt tối thiểu:

- Semantic `<h1>`
- Keyboard accessible navigation
- Visible focus state
- Sufficient text contrast
- CTA có accessible label
- Decorative 3D background dùng `aria-hidden`
- Không encode critical information chỉ bằng màu
- Mobile touch targets tối thiểu khoảng `44px`

---

# 30. Content Integrity Rules

Hero không được hiển thị những thông tin không có bằng chứng.

Không sử dụng:

```text
10,000+ users
```

```text
98% better decisions
```

```text
95% AI accuracy
```

```text
Trusted by thousands
```

nếu Future Me chưa có dữ liệu thực tế chứng minh.

---

# 31. Demo Data Rule

Conversation Preview sử dụng **static demo content**.

Không sử dụng dữ liệu thật của visitor trong public Hero.

Demo phải được label rõ:

```text
EXAMPLE CONVERSATION
```

hoặc:

```text
DEMO
```

để tránh tạo cảm giác Future Me đã truy cập dữ liệu cá nhân khi người dùng chưa đồng ý.

---

# 32. Design Tokens

## Colors

```css
--fm-purple: #7C3AED;
--fm-purple-light: #F3EAFF;

--fm-text-primary: #17171C;
--fm-text-secondary: #666873;
--fm-text-muted: #8C8E99;

--fm-background: #E5EDFC;
--fm-surface: #FFFFFF;

--fm-blue-soft: #DCE8FF;
--fm-lavender-soft: #E9E4FF;
--fm-pink-soft: #F6E8FA;
```

---

## Border Radius

```css
--radius-page: 40px;
--radius-panel: 32px;
--radius-card: 20px;
--radius-mobile: 24px;
--radius-pill: 999px;
```

---

## Shadow

```css
--shadow-card:
  0 16px 50px rgba(55, 45, 95, 0.12);
```

Avoid heavy black shadows.

---

# 33. Typography System

Preferred:

```text
Plus Jakarta Sans
```

Alternative:

```text
Manrope
```

Recommended hierarchy:

| Element | Weight |
|---|---:|
| Logo | `700` |
| Hero headline | `650–700` |
| Section labels | `600` |
| Body | `400–500` |
| CTA | `600` |
| Context labels | `500–600` |

---

# 34. Suggested Component Structure

Frontend có thể chia Hero thành:

```text
LandingHero
├── HeroNavigation
│   ├── Logo
│   ├── DesktopNavigation
│   └── MobileNavigation
│
├── HeroContent
│   ├── HeroEyebrow
│   ├── HeroHeadline
│   ├── HeroDescription
│   ├── HeroActions
│   ├── HeroMicrocopy
│   └── HeroInfoCard
│
└── HeroVisual
    ├── HeroLandscape
    ├── DecisionConversationPreview
    │   ├── UserMessage
    │   ├── FutureMeMessage
    │   ├── RelevantContextCard
    │   └── DecisionActions
    │
    └── FloatingContextCards
```

Không bắt buộc đúng tên component này.

Mục tiêu là tránh triển khai toàn bộ Hero thành một component monolithic.

---

# 35. CTA Routing Contract

Pseudo logic:

```ts
function handleGetStarted(user) {
  if (!user.isAuthenticated) {
    redirectToAuth({
      returnTo: "/decisions",
    });
    return;
  }

  if (!user.hasCompletedOnboarding) {
    redirectToOnboarding({
      returnTo: "/decisions",
    });
    return;
  }

  redirect("/decisions");
}
```

Intent `/decisions` cần được giữ qua authentication và onboarding.

---

# 36. Acceptance Criteria

Hero được xem là đạt khi:

### Product Understanding

Một người mới có thể hiểu:

- Future Me hỗ trợ decision-making.
- Future Me sử dụng personal context.
- Future Me giúp khám phá options và trade-offs.
- Future Me không quyết định thay người dùng.

---

### Conversion

Có đúng một Primary CTA rõ ràng:

```text
Get Started
```

và một Secondary CTA:

```text
See how it works
```

---

### Visual

- Split Hero rõ ràng trên desktop.
- Right Visual lớn hơn Left nhẹ.
- Main Product Preview nổi bật hơn Floating Cards.
- 3D visual hỗ trợ sản phẩm, không lấn át content.

---

### Navigation

- Public user thấy `Sign in`.
- Authenticated user thấy `Go to Dashboard`.
- Anchor links scroll đúng section.

---

### Responsive

- Desktop hoàn chỉnh.
- Tablet không overflow.
- Mobile single-column.
- Hero Preview vẫn đọc được trên mobile.

---

### Content Integrity

Không có:

- fake metric,
- fake user count,
- fake AI accuracy,
- fake testimonial,
- fake social proof.

---

### Accessibility

- Một semantic `h1`.
- Keyboard navigation hoạt động.
- Focus state rõ.
- Text contrast đạt yêu cầu.
- Reduced-motion được hỗ trợ.

---

# 37. Final Hero Copy

## Navigation

```text
future me.

How it works
Features
About
Sign in ↗
```

---

## Eyebrow

```text
YOUR AI DECISION COMPANION
```

---

## Headline

```text
Make decisions with your future in mind.
```

---

## Description

```text
Future Me brings your goals, commitments, and preferences
into one conversation, helping you explore your options
and make decisions with clarity.
```

---

## CTA

```text
Get Started ↗

See how it works
```

---

## Microcopy

```text
Your future is yours to shape.
```

---

## Bottom Card

```text
More than an answer.
A clearer way forward.

See how Future Me connects your context,
decisions, and next steps.

Explore how it works →
```

---

# 38. Hero Product Preview Copy

```text
EXAMPLE CONVERSATION

YOU

Should I join a hackathon when my project deadline
is so close?


FUTURE ME

Let's look at this in the context of your
current priorities.


RELEVANT CONTEXT

Active goal
Complete project MVP

Deadline
In 3 days

Preference
Morning deep work


We can compare the time commitment,
potential benefits, and impact on your MVP.


Explore options

Understand trade-offs
```

---

# 39. Core Message

Hero phải truyền tải được mental model sau:

```text
Generic AI

Question
   ↓
Answer
```

Future Me:

```text
Question
   ↓
Relevant Personal Context
   ↓
Options + Trade-offs
   ↓
Decision Support
   ↓
User Choice
```

Future Me không cố gắng trở thành AI biết mọi thứ về người dùng.

Nó chỉ sử dụng **relevant context** để giúp người dùng nhìn rõ hơn quyết định trước mắt và mối liên hệ của quyết định đó với những gì họ đang hướng tới.

---

## Final Design Principle

> **Future Me should feel less like an AI giving answers and more like a thoughtful companion helping the user see the decision more clearly.**