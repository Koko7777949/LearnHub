"use client";

import React, { createContext, useContext } from "react";

export type Lang = "en" | "zh";

const dict = {
  // ---------- brand / common ----------
  appName: { en: "LearnHub", zh: "LearnHub" },
  loading: { en: "Loading…", zh: "加载中…" },
  cancel: { en: "Cancel", zh: "取消" },
  confirm: { en: "Confirm", zh: "确认" },
  save: { en: "Save", zh: "保存" },
  search: { en: "Search", zh: "搜索" },
  all: { en: "All", zh: "全部" },
  none: { en: "None", zh: "无" },
  error: { en: "Something went wrong", zh: "出现错误" },
  retry: { en: "Try again", zh: "重试" },
  empty: { en: "Nothing here yet", zh: "暂无内容" },
  back: { en: "Back", zh: "返回" },
  close: { en: "Close", zh: "关闭" },
  viewAll: { en: "View all", zh: "查看全部" },
  copy: { en: "Copy", zh: "复制" },
  demoPassword: { en: "Password (demo: demo123)", zh: "密码（演示：demo123）" },

  // ---------- roles ----------
  roleStudent: { en: "Student", zh: "学生" },
  roleInstructor: { en: "Instructor", zh: "讲师" },
  roleAdmin: { en: "Admin", zh: "管理员" },

  // ---------- auth ----------
  loginTitle: { en: "Welcome back", zh: "欢迎回来" },
  loginSubtitle: { en: "Sign in to continue learning, teaching, or managing the platform.", zh: "登录以继续学习、授课或管理平台。" },
  email: { en: "Email address", zh: "邮箱地址" },
  password: { en: "Password", zh: "密码" },
  signIn: { en: "Sign in", zh: "登录" },
  signingIn: { en: "Signing in…", zh: "登录中…" },
  invalidCreds: { en: "Invalid email or password", zh: "邮箱或密码错误" },
  quickLogin: { en: "One-click demo accounts", zh: "一键演示登录" },
  quickLoginHint: { en: "Explore each role instantly — no signup needed.", zh: "免注册，立即体验各类角色。" },
  loginFooterNote: { en: "Demo environment · no real payments are processed", zh: "演示环境 · 不处理真实付款" },

  // ---------- header / nav ----------
  navMarketplace: { en: "Marketplace", zh: "课程市场" },
  navMyLearning: { en: "My Learning", zh: "我的学习" },
  navInstructor: { en: "Instructor", zh: "讲师中心" },
  navLedger: { en: "Revenue Ledger", zh: "收益账本" },
  navAdmin: { en: "Admin", zh: "管理后台" },
  logout: { en: "Log out", zh: "退出登录" },
  switchLang: { en: "中文", zh: "EN" },

  // ---------- marketplace ----------
  heroBadge: { en: "70/30 revenue share · instant payouts", zh: "70/30 收益分成 · 极速打款" },
  heroTitle1: { en: "Learn skills that", zh: "学习真正" },
  heroTitle2: { en: "pay the bills", zh: "赚钱的技能" },
  heroSubtitle: {
    en: "10 expert-built courses on development, data science, design and cloud — with transparent instructor economics on every sale.",
    zh: "10 门专家课程，覆盖开发、数据科学、设计与云计算 — 每笔销售讲师收益透明可见。",
  },
  heroStatCourses: { en: "Expert courses", zh: "精品课程" },
  heroStatStudents: { en: "Enrollments", zh: "报名人次" },
  heroStatRating: { en: "Avg. rating", zh: "平均评分" },
  searchPlaceholder: { en: "Search courses, topics, instructors…", zh: "搜索课程、主题、讲师…" },
  categories: { en: "Categories", zh: "分类" },
  levelLabel: { en: "Level", zh: "难度" },
  sortLabel: { en: "Sort", zh: "排序" },
  sortPopular: { en: "Most popular", zh: "最热门" },
  sortNewest: { en: "Newest", zh: "最新" },
  sortPriceLow: { en: "Price: low to high", zh: "价格：从低到高" },
  sortPriceHigh: { en: "Price: high to low", zh: "价格：从高到低" },
  sortRating: { en: "Highest rated", zh: "评分最高" },
  resultsFound: { en: "courses found", zh: "门课程" },
  noCourses: { en: "No courses match your filters.", zh: "没有符合条件的课程。" },
  clearFilters: { en: "Clear filters", zh: "清除筛选" },

  // course card
  bestseller: { en: "Bestseller", zh: "畅销" },
  studentsCount: { en: "students", zh: "人学习" },
  lessonsLabel: { en: "lessons", zh: "节课" },
  hoursLabel: { en: "h", zh: "小时" },
  offLabel: { en: "off", zh: "折" },

  // ---------- course detail ----------
  whatYouLearn: { en: "What you'll learn", zh: "你将学会" },
  curriculum: { en: "Course curriculum", zh: "课程大纲" },
  previewLesson: { en: "Preview", zh: "试看" },
  totalLessons: { en: "lessons", zh: "节课" },
  aboutInstructor: { en: "About the instructor", zh: "关于讲师" },
  buyNow: { en: "Buy now", zh: "立即购买" },
  owned: { en: "You own this course", zh: "你已拥有该课程" },
  goToCourse: { en: "Go to My Learning", zh: "前往我的学习" },
  purchasing: { en: "Processing…", zh: "处理中…" },
  purchaseSuccess: { en: "Purchase complete — course added to My Learning", zh: "购买成功 — 课程已加入我的学习" },
  alreadyOwned: { en: "You already own this course", zh: "你已拥有该课程" },
  lifetimeAccess: { en: "Lifetime access", zh: "终身访问" },
  certificate: { en: "Certificate of completion", zh: "结业证书" },
  refundPolicy: { en: "30-day refund policy", zh: "30 天退款保障" },
  priceIncludes: { en: "This course includes:", zh: "本课程包含：" },
  courseLevel: { en: "Level", zh: "难度" },
  courseLanguage: { en: "Language", zh: "语言" },
  lastUpdated: { en: "Last updated", zh: "最近更新" },

  // levels
  levelBeginner: { en: "Beginner", zh: "入门" },
  levelIntermediate: { en: "Intermediate", zh: "进阶" },
  levelAdvanced: { en: "Advanced", zh: "高级" },

  // categories
  catDevelopment: { en: "Development", zh: "开发" },
  catBusiness: { en: "Business", zh: "商业" },
  catDesign: { en: "Design", zh: "设计" },
  catDataScience: { en: "Data Science", zh: "数据科学" },
  catMarketing: { en: "Marketing", zh: "市场营销" },
  catIT: { en: "IT & Software", zh: "IT 与软件" },

  // ---------- student dashboard ----------
  myLearningTitle: { en: "My Learning", zh: "我的学习" },
  myLearningSubtitle: { en: "Pick up where you left off and track your progress.", zh: "继续上次的学习并跟踪进度。" },
  enrolledCourses: { en: "Enrolled courses", zh: "已报名课程" },
  completedCourses: { en: "Completed", zh: "已完成" },
  inProgress: { en: "In progress", zh: "学习中" },
  hoursLearned: { en: "Content hours owned", zh: "内容总时长" },
  avgProgress: { en: "Average progress", zh: "平均进度" },
  continueLearning: { en: "Continue learning", zh: "继续学习" },
  noEnrollments: { en: "You haven't enrolled in any course yet.", zh: "你还没有报名任何课程。" },
  browseCourses: { en: "Browse courses", zh: "浏览课程" },
  purchaseHistory: { en: "Purchase history", zh: "购买记录" },
  purchaseHistorySubtitle: { en: "Every charge on your account, with refund status.", zh: "账户中的每一笔消费及退款状态。" },
  totalSpent: { en: "Total spent", zh: "累计消费" },
  purchaseColDate: { en: "Date", zh: "日期" },
  purchaseColCourse: { en: "Course", zh: "课程" },
  purchaseColAmount: { en: "Amount", zh: "金额" },
  purchaseColStatus: { en: "Status", zh: "状态" },
  refundRequested: { en: "Refunded", zh: "已退款" },

  // ---------- instructor dashboard ----------
  instructorTitle: { en: "Instructor Studio", zh: "讲师中心" },
  instructorSubtitle: { en: "Course performance, students and earnings at a glance.", zh: "课程表现、学员与收益一览。" },
  statTotalStudents: { en: "Total students", zh: "学员总数" },
  statTotalRevenue: { en: "Net earnings (all time)", zh: "净收益（累计）" },
  statAvgRating: { en: "Average rating", zh: "平均评分" },
  statCourses: { en: "Published courses", zh: "已发布课程" },
  myCourses: { en: "My courses", zh: "我的课程" },
  colCourse: { en: "Course", zh: "课程" },
  colStudents: { en: "Students", zh: "学员" },
  colRating: { en: "Rating", zh: "评分" },
  colRevenue: { en: "Net revenue", zh: "净收益" },
  colPrice: { en: "Price", zh: "价格" },
  colStatus: { en: "Status", zh: "状态" },
  colLevel: { en: "Level", zh: "难度" },
  colCategory: { en: "Category", zh: "分类" },
  openLedger: { en: "Open Revenue Ledger", zh: "打开收益账本" },
  noCoursesYet: { en: "You haven't published any courses yet.", zh: "你还没有发布课程。" },
  draft: { en: "Draft", zh: "草稿" },
  published: { en: "Published", zh: "已发布" },

  // ---------- revenue ledger ----------
  ledgerTitle: { en: "Revenue Ledger", zh: "收益账本" },
  ledgerSubtitle: {
    en: "Every sale, refund and payout — with the exact 70/30 split applied.",
    zh: "每笔销售、退款与打款 — 精确执行 70/30 分成。",
  },
  ledgerTabOverview: { en: "Overview", zh: "总览" },
  ledgerTabTransactions: { en: "Transactions", zh: "交易明细" },
  ledgerTabPayouts: { en: "Payouts", zh: "打款记录" },
  ledgerTabByCourse: { en: "By Course", zh: "按课程分析" },
  statLifetime: { en: "Lifetime net earnings", zh: "累计净收益" },
  statAvailable: { en: "Available balance", zh: "可用余额" },
  statPendingPayout: { en: "Pending payouts", zh: "处理中打款" },
  statGrossSales: { en: "Gross sales volume", zh: "销售总额" },
  statRefunds: { en: "Total refunds", zh: "退款总额" },
  statPlatformFee: { en: "Platform fees paid", zh: "平台佣金" },
  statSaleCount: { en: "Sales", zh: "成交笔数" },
  statLast30: { en: "Net · last 30 days", zh: "净收益 · 近 30 天" },
  revenueTrend: { en: "Monthly net earnings", zh: "每月净收益" },
  revenueTrendHint: { en: "After 30% platform fee, before payouts", zh: "扣除 30% 平台佣金后、打款前" },
  revenueSplit: { en: "Revenue split", zh: "分成结构" },
  splitYou: { en: "You (70%)", zh: "你（70%）" },
  splitPlatform: { en: "Platform (30%)", zh: "平台（30%）" },
  recentActivity: { en: "Recent activity", zh: "最近动态" },
  exportCsv: { en: "Export CSV", zh: "导出 CSV" },
  requestPayout: { en: "Request payout", zh: "申请打款" },
  payoutMethod: { en: "Payout method", zh: "打款方式" },
  payoutAmount: { en: "Amount (USD)", zh: "金额（美元）" },
  availableNow: { en: "Available now", zh: "当前可用" },
  payoutRequested: { en: "Payout requested — awaiting admin approval", zh: "打款已申请 — 等待管理员审核" },
  payoutTooMuch: { en: "Amount exceeds available balance", zh: "金额超出可用余额" },
  payoutInvalid: { en: "Enter a valid amount", zh: "请输入有效金额" },
  colDate: { en: "Date", zh: "日期" },
  colType: { en: "Type", zh: "类型" },
  colStudent: { en: "Student", zh: "学员" },
  colGross: { en: "Gross", zh: "总金额" },
  colFee: { en: "Platform fee", zh: "平台佣金" },
  colNet: { en: "Net earnings", zh: "净收益" },
  colBalance: { en: "Running balance", zh: "账户余额" },
  colAmount: { en: "Amount", zh: "金额" },
  colMethod: { en: "Method", zh: "方式" },
  colRequested: { en: "Requested", zh: "申请时间" },
  colProcessed: { en: "Processed", zh: "处理时间" },
  colNote: { en: "Note", zh: "备注" },
  filterType: { en: "Type", zh: "类型" },
  filterCourse: { en: "Course", zh: "课程" },
  filterRange: { en: "Period", zh: "时间范围" },
  rangeAll: { en: "All time", zh: "全部" },
  range30: { en: "Last 30 days", zh: "近 30 天" },
  range90: { en: "Last 90 days", zh: "近 90 天" },
  range180: { en: "Last 6 months", zh: "近 6 个月" },
  typeSale: { en: "Sale", zh: "销售" },
  typeRefund: { en: "Refund", zh: "退款" },
  typePayout: { en: "Payout", zh: "打款" },
  txSaleDesc: { en: "Course sale", zh: "课程销售" },
  txRefundDesc: { en: "Refund issued", zh: "退款" },
  txPayoutDesc: { en: "Payout to instructor", zh: "讲师打款" },
  txCompleted: { en: "Completed", zh: "已完成" },
  txRefunded: { en: "Refunded", zh: "已退款" },
  payoutPending: { en: "Pending", zh: "待审核" },
  payoutApproved: { en: "Approved", zh: "已批准" },
  payoutPaid: { en: "Paid", zh: "已打款" },
  payoutRejected: { en: "Rejected", zh: "已拒绝" },
  methodPaypal: { en: "PayPal", zh: "PayPal" },
  methodBank: { en: "Bank transfer", zh: "银行转账" },
  methodStripe: { en: "Stripe", zh: "Stripe" },
  noTransactions: { en: "No transactions match the current filters.", zh: "没有符合当前筛选的交易。" },
  noPayouts: { en: "No payout requests yet.", zh: "还没有打款申请。" },
  byCourseTitle: { en: "Earnings by course", zh: "各课程收益" },
  byCourseHint: { en: "Net of refunds, sorted by lifetime net earnings", zh: "已扣除退款，按累计净收益排序" },
  colSales: { en: "Sales", zh: "销量" },
  colRefunds: { en: "Refunds", zh: "退款" },
  colShare: { en: "Share", zh: "占比" },
  ledgerExplainer: {
    en: "How the ledger works",
    zh: "账本规则说明",
  },
  ledgerExplainerBody: {
    en: "Every course sale is recorded as a gross amount, a 30% platform fee, and your 70% net earnings. Refunds create offsetting negative entries. Payouts are deducted from your available balance once approved.",
    zh: "每笔课程销售记录总金额、30% 平台佣金与你的 70% 净收益。退款生成等额负向条目。打款一经批准即从可用余额中扣除。",
  },

  // ---------- admin ----------
  adminTitle: { en: "Platform Administration", zh: "平台管理" },
  adminSubtitle: { en: "Monitor marketplace health, approve payouts and manage users.", zh: "监控平台运营、审批打款并管理用户。" },
  statGmv: { en: "Gross volume (all time)", zh: "交易总额" },
  statPlatformRevenue: { en: "Platform revenue (30%)", zh: "平台收益（30%）" },
  statInstructorPay: { en: "Instructor earnings (70%)", zh: "讲师收益（70%）" },
  statUserCount: { en: "Registered users", zh: "注册用户" },
  adminTabOverview: { en: "Overview", zh: "总览" },
  adminTabPayouts: { en: "Payout approvals", zh: "打款审批" },
  adminTabUsers: { en: "Users", zh: "用户" },
  adminTabCourses: { en: "Courses", zh: "课程" },
  payoutQueue: { en: "Payout approval queue", zh: "打款审批队列" },
  payoutQueueEmpty: { en: "No payouts awaiting approval. 🎉", zh: "暂无待审批打款。🎉" },
  approve: { en: "Approve", zh: "批准" },
  markPaid: { en: "Mark as paid", zh: "标记已打款" },
  reject: { en: "Reject", zh: "拒绝" },
  rejectReason: { en: "Reason for rejection (shown to instructor)", zh: "拒绝原因（讲师可见）" },
  payoutApprovedToast: { en: "Payout approved", zh: "打款已批准" },
  payoutPaidToast: { en: "Payout marked as paid", zh: "打款已标记完成" },
  payoutRejectedToast: { en: "Payout rejected", zh: "打款已拒绝" },
  colUser: { en: "User", zh: "用户" },
  colRole: { en: "Role", zh: "角色" },
  colEmail: { en: "Email", zh: "邮箱" },
  colCountry: { en: "Country", zh: "国家/地区" },
  colJoined: { en: "Joined", zh: "注册时间" },
  colInstructor: { en: "Instructor", zh: "讲师" },
  revenueByCategory: { en: "Gross volume by category", zh: "各类别交易额" },
  platformVsInstructor: { en: "Platform vs instructor split", zh: "平台与讲师分成" },
  recentTransactions: { en: "Recent transactions", zh: "最近交易" },

  // ---------- footer ----------
  footerTagline: { en: "The transparent online course marketplace.", zh: "透明的在线课程市场。" },
  footerRights: { en: "Demo project · Built with Next.js, Prisma & Recharts", zh: "演示项目 · 基于 Next.js、Prisma 与 Recharts 构建" },

  // ---------- misc ----------
  currency: { en: "USD", zh: "美元" },
  runningBalanceNote: {
    en: "Running balance is cumulative net earnings within the current filters, in chronological order.",
    zh: "账户余额为当前筛选范围内的累计净收益，按时间顺序计算。",
  },

  // ---------- course player ----------
  playerBackToLearning: { en: "Back to My Learning", zh: "返回我的学习" },
  playerLessonLabel: { en: "Lesson", zh: "课时" },
  playerOf: { en: "of", zh: "/" },
  playerMarkComplete: { en: "Mark as complete", zh: "标记为已完成" },
  playerCompleted: { en: "Completed", zh: "已完成" },
  playerMarkIncomplete: { en: "Mark as not done", zh: "取消完成标记" },
  playerPrev: { en: "Previous", zh: "上一课" },
  playerNext: { en: "Next lesson", zh: "下一课" },
  playerTabOverview: { en: "Overview", zh: "概览" },
  playerTabNotes: { en: "Notes", zh: "笔记" },
  playerNotesPlaceholder: {
    en: "Jot down your notes for this lesson… they save automatically.",
    zh: "为本课时记下笔记…将自动保存。",
  },
  playerNotesSaved: { en: "Saved", zh: "已保存" },
  playerNotesSaving: { en: "Saving…", zh: "保存中…" },
  playerCourseContent: { en: "Course content", zh: "课程内容" },
  playerLockedLesson: { en: "Locked", zh: "未解锁" },
  playerPreviewOnly: {
    en: "You're watching a free preview. Enroll to unlock the full course.",
    zh: "你正在观看免费试看。报名后即可解锁完整课程。",
  },
  playerEnrollNow: { en: "Enroll now", zh: "立即报名" },
  playerProgressLabel: { en: "course progress", zh: "课程进度" },
  playerLessonSummary: { en: "About this lesson", zh: "本课时简介" },
  playerResources: { en: "Resources included", zh: "配套资源" },
  playerResourceSlides: { en: "Lesson slides (PDF)", zh: "课件幻灯片（PDF）" },
  playerResourceCode: { en: "Exercise files & source code", zh: "练习文件与源代码" },
  playerResourceQuiz: { en: "Knowledge check quiz", zh: "知识点测验" },
  playerCongrats: {
    en: "Congratulations — you completed the course!",
    zh: "恭喜 — 你已完成全部课程！",
  },
  playerCongratsBody: {
    en: "You finished every lesson. Claim your certificate of completion below.",
    zh: "你已完成所有课时。点击下方领取结业证书。",
  },

  // ---------- certificate ----------
  getCertificate: { en: "Get certificate", zh: "领取证书" },
  certificateTitle: { en: "Certificate of Completion", zh: "结业证书" },
  certificateThisCertifies: { en: "This certifies that", zh: "特此证明" },
  certificateHasCompleted: { en: "has successfully completed the course", zh: "已成功完成课程" },
  certificateInstructorSig: { en: "Instructor", zh: "讲师" },
  certificatePlatformSig: { en: "LearnHub Academy", zh: "LearnHub 学院" },
  certificateDate: { en: "Date of completion", zh: "完成日期" },
  certificateId: { en: "Certificate ID", zh: "证书编号" },
  printCertificate: { en: "Print / Save PDF", zh: "打印 / 保存 PDF" },

  // ---------- reviews ----------
  reviewsTitle: { en: "Student reviews", zh: "学员评价" },
  reviewsRecentSubtitle: { en: "Recent reviews from verified learners", zh: "来自已验证学员的最新评价" },
  reviewsEmpty: { en: "No reviews yet — be the first to review this course.", zh: "暂无评价 — 快来成为第一位评价者。" },
  writeReview: { en: "Write a review", zh: "撰写评价" },
  editReview: { en: "Edit your review", zh: "修改评价" },
  yourRating: { en: "Your rating", zh: "你的评分" },
  reviewCommentLabel: { en: "Your review", zh: "评价内容" },
  reviewPlaceholder: {
    en: "What did you like? What could be better? Share your experience…",
    zh: "课程哪里最打动你？哪里可以改进？分享你的学习体验…",
  },
  submitReview: { en: "Submit review", zh: "提交评价" },
  reviewSubmitted: { en: "Review submitted — thank you!", zh: "评价已提交 — 感谢分享！" },
  ownToReview: { en: "Only students who own this course can review it.", zh: "仅已购买本课程的学员可以评价。" },
  ratingBreakdown: { en: "Rating breakdown", zh: "评分分布" },
  verifiedLearner: { en: "Verified learner", zh: "已验证学员" },
  yourReviewBadge: { en: "Your review", zh: "你的评价" },

  // ---------- wishlist ----------
  wishlist: { en: "Wishlist", zh: "心愿单" },
  wishlistEmpty: { en: "Your wishlist is empty — tap the heart on any course to save it.", zh: "心愿单还是空的 — 点击课程卡片上的爱心即可收藏。" },
  addToWishlist: { en: "Add to wishlist", zh: "加入心愿单" },
  removeFromWishlist: { en: "Remove from wishlist", zh: "移出心愿单" },
  wishlistedToast: { en: "Added to your wishlist", zh: "已加入心愿单" },
  unWishlistedToast: { en: "Removed from your wishlist", zh: "已从心愿单移除" },
  wishAddedOn: { en: "Saved", zh: "收藏于" },

  // ---------- my learning tabs ----------
  tabAll: { en: "All courses", zh: "全部课程" },
  tabInProgress: { en: "In progress", zh: "学习中" },
  tabCompleted: { en: "Completed", zh: "已完成" },
  tabWishlist: { en: "Wishlist", zh: "心愿单" },
  goToLessons: { en: "Go to course", zh: "进入学习" },

  // ---------- instructor studio (create course) ----------
  createCourse: { en: "Create course", zh: "创建课程" },
  studioTitle: { en: "Course Studio", zh: "课程创作中心" },
  studioSubtitle: {
    en: "Draft a new course, add lessons and publish it to the marketplace.",
    zh: "编写新课程、添加课时并发布到课程市场。",
  },
  fieldTitle: { en: "Course title", zh: "课程标题" },
  fieldTitlePlaceholder: { en: "e.g. Advanced TypeScript Patterns", zh: "例如：TypeScript 高级模式详解" },
  fieldSubtitle: { en: "Subtitle", zh: "副标题" },
  fieldSubtitlePlaceholder: { en: "One sentence that sells the course", zh: "一句话说明课程核心价值" },
  fieldDescription: { en: "Description", zh: "课程介绍" },
  fieldDescriptionPlaceholder: {
    en: "What will students learn? Who is it for? What's included?",
    zh: "学员将学到什么？适合谁？包含哪些内容？",
  },
  fieldPrice: { en: "Price (USD)", zh: "价格（美元）" },
  fieldCategory: { en: "Category", zh: "分类" },
  fieldLevel: { en: "Level", zh: "难度" },
  fieldLanguage: { en: "Teaching language", zh: "授课语言" },
  fieldCoverTheme: { en: "Cover theme", zh: "封面主题" },
  lessonsBuilder: { en: "Curriculum", zh: "课程大纲" },
  lessonsBuilderHint: { en: "First 2 lessons are automatically free previews.", zh: "前 2 课时自动设为免费试看。" },
  addLesson: { en: "Add lesson", zh: "添加课时" },
  lessonTitlePlaceholder: { en: "Lesson title…", zh: "课时标题…" },
  lessonDuration: { en: "min", zh: "分钟" },
  removeLesson: { en: "Remove", zh: "删除" },
  publishCourse: { en: "Publish course", zh: "发布课程" },
  publishingCourse: { en: "Publishing…", zh: "发布中…" },
  coursePublished: { en: "Course published — now live on the marketplace!", zh: "课程已发布 — 现已上架课程市场！" },
  errTitleRequired: { en: "A course title is required.", zh: "请填写课程标题。" },
  errLessonsRequired: { en: "Add at least one lesson.", zh: "请至少添加一个课时。" },
  errPriceInvalid: { en: "Enter a price between $0 and $999.", zh: "请输入 0–999 美元之间的价格。" },

  // ---------- profile ----------
  profileTitle: { en: "My Profile", zh: "个人主页" },
  profileSubtitle: { en: "Your public presence, stats and achievements.", zh: "你的公开主页、数据与成就。" },
  editProfile: { en: "Edit profile", zh: "编辑资料" },
  saveProfile: { en: "Save changes", zh: "保存修改" },
  profileSaved: { en: "Profile updated", zh: "资料已更新" },
  memberSince: { en: "Member since", zh: "注册时间" },
  accountInfo: { en: "Account", zh: "账户信息" },
  fieldHeadline: { en: "Headline", zh: "头衔" },
  fieldHeadlinePlaceholder: { en: "e.g. Frontend Developer & lifelong learner", zh: "例如：前端开发者 · 终身学习者" },
  fieldBio: { en: "Bio", zh: "个人简介" },
  fieldBioPlaceholder: { en: "Tell the community about yourself…", zh: "向社区介绍一下你自己…" },
  fieldCountry: { en: "Country", zh: "国家/地区" },
  myStats: { en: "My stats", zh: "我的数据" },
  achievements: { en: "Achievements", zh: "成就徽章" },
  achFirstEnrollment: { en: "First step — enrolled in a first course", zh: "第一步 — 报名首门课程" },
  achThreeCourses: { en: "Learner — 3 courses enrolled", zh: "学习者 — 报名 3 门课程" },
  achFirstCompletion: { en: "Finisher — completed a first course", zh: "完结者 — 完成首门课程" },
  achReviewer: { en: "Reviewer — wrote a course review", zh: "评论家 — 撰写课程评价" },
  achCreator: { en: "Creator — published a course", zh: "创作者 — 发布课程" },
  achThreeCoursesCreated: { en: "Author — 3 courses published", zh: "著作者 — 发布 3 门课程" },
  achHighEarner: { en: "High earner — $1,000+ lifetime earnings", zh: "高收入讲师 — 累计收益超 1000 美元" },
  achWishlisted: { en: "Curator — saved courses to wishlist", zh: "策展人 — 收藏课程到心愿单" },
  lockedAch: { en: "Locked", zh: "未解锁" },
  noHeadlineYet: { en: "No headline yet — add one in Edit profile.", zh: "暂无头衔 — 点击编辑资料添加。" },

  // ---------- navigation extras ----------
  navProfile: { en: "My Profile", zh: "个人主页" },
  navCreateCourse: { en: "Create Course", zh: "创建课程" },
} as const;

export type DictKey = keyof typeof dict;

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({
  lang,
  setLang,
  children,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  children: React.ReactNode;
}) {
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  const t = (key: DictKey) => dict[key][ctx.lang];
  return { t, lang: ctx.lang, setLang: ctx.setLang };
}

// category / level / status translation helpers
export function trCategory(cat: string, lang: Lang) {
  const map: Record<string, DictKey> = {
    Development: "catDevelopment",
    Business: "catBusiness",
    Design: "catDesign",
    "Data Science": "catDataScience",
    Marketing: "catMarketing",
    "IT & Software": "catIT",
  };
  const key = map[cat];
  return key ? dict[key][lang] : cat;
}

export function trLevel(level: string, lang: Lang) {
  const map: Record<string, DictKey> = {
    BEGINNER: "levelBeginner",
    INTERMEDIATE: "levelIntermediate",
    ADVANCED: "levelAdvanced",
  };
  const key = map[level];
  return key ? dict[key][lang] : level;
}
