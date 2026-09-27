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
