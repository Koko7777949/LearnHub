/* Seed script: online courses platform with instructor revenue ledger */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ---------- deterministic PRNG ----------
let seed = 42;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const round2 = (n: number) => Math.round(n * 100) / 100;

const PLATFORM_FEE_RATE = 0.3;

// ---------- public sample lesson videos (CC / free test assets on reliable global CDNs) ----------
const SAMPLE_VIDEOS = [
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4",
  "https://media.w3.org/2010/05/bunny/movie.mp4",
  "https://media.w3.org/2010/05/video/movie_300.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://mdn.github.io/shared-assets/videos/flower.mp4",
  "https://mdn.github.io/shared-assets/videos/friday.mp4",
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4",
];

const daysAgo = (d: number, jitterHours = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(randInt(8, 22), randInt(0, 59), 0, 0);
  if (jitterHours) date.setHours(date.getHours() - randInt(0, jitterHours));
  return date;
};

async function main() {
  console.log("Clearing existing data...");
  await db.wishlist.deleteMany();
  await db.review.deleteMany();
  await db.lessonProgress.deleteMany();
  await db.payout.deleteMany();
  await db.transaction.deleteMany();
  await db.enrollment.deleteMany();
  await db.lesson.deleteMany();
  await db.coupon.deleteMany();
  await db.course.deleteMany();
  await db.user.deleteMany();

  console.log("Creating users...");
  const admin = await db.user.create({
    data: {
      email: "admin@learnhub.dev",
      name: "Marcus Webb",
      password: "demo123",
      role: "ADMIN",
      avatarColor: "slate",
      headline: "Platform Administrator",
      country: "United States",
    },
  });

  const instructorData = [
    {
      email: "sarah@learnhub.dev",
      name: "Sarah Chen",
      password: "demo123",
      role: "INSTRUCTOR",
      avatarColor: "indigo",
      headline: "Senior Full-Stack Engineer @ ex-Stripe · 12y teaching",
      bio: "I've spent the last decade building payment systems and teaching developers how to ship production-grade web apps. My courses focus on real-world architecture, not toy examples.",
      country: "United States",
    },
    {
      email: "diego@learnhub.dev",
      name: "Diego Ramírez",
      password: "demo123",
      role: "INSTRUCTOR",
      avatarColor: "teal",
      headline: "Data Scientist & ML Consultant",
      bio: "Former research scientist turned educator. I make machine learning approachable with visual explanations and hands-on projects.",
      country: "Spain",
    },
    {
      email: "amina@learnhub.dev",
      name: "Amina Okafor",
      password: "demo123",
      role: "INSTRUCTOR",
      avatarColor: "rose",
      headline: "Product Design Lead · Design Systems Specialist",
      bio: "I lead design at a fintech scale-up and teach UX strategy, design systems, and Figma mastery to 80,000+ students worldwide.",
      country: "Nigeria",
    },
    {
      email: "kenji@learnhub.dev",
      name: "Kenji Tanaka",
      password: "demo123",
      role: "INSTRUCTOR",
      avatarColor: "amber",
      headline: "Cloud Architect · AWS Hero",
      bio: "云架构师，AWS Hero。专注云原生架构、DevOps 与高可用系统设计。10 年以上企业级架构经验。",
      country: "Japan",
    },
  ];

  const instructors: Record<string, string> = {};
  for (const i of instructorData) {
    const u = await db.user.create({ data: i });
    instructors[i.email] = u.id;
  }

  const studentNames = [
    ["Liam Petrov", "liam@student.dev", "blue"],
    ["Emma Fischer", "emma@student.dev", "violet"],
    ["Noah Kim", "noah@student.dev", "emerald"],
    ["Olivia Rossi", "olivia@student.dev", "pink"],
    ["Ethan Dubois", "ethan@student.dev", "cyan"],
    ["Ava Johansson", "ava@student.dev", "orange"],
    ["Lucas Silva", "lucas@student.dev", "lime"],
    ["Maya Patel", "maya@student.dev", "fuchsia"],
    ["Ben Carter", "ben@student.dev", "sky"],
    ["Sofia López", "sofia@student.dev", "purple"],
    ["Alex Novak", "alex@student.dev", "red"],
    ["Chloé Martin", "chloe@student.dev", "green"],
    ["Raj Mehta", "raj@student.dev", "amber"],
    ["Yuki Yamada", "yuki@student.dev", "teal"],
  ];
  const students: { id: string; email: string }[] = [];
  for (const [name, email, color] of studentNames) {
    const u = await db.user.create({
      data: {
        email,
        name,
        password: "demo123",
        role: "STUDENT",
        avatarColor: color,
        country: pick(["United States", "Germany", "India", "Brazil", "Japan", "France", "China"]),
      },
    });
    students.push({ id: u.id, email });
  }

  console.log("Creating courses & lessons...");
  const courseData = [
    {
      title: "The Complete Full-Stack Web Developer Bootcamp 2026",
      subtitle: "React, Next.js 16, TypeScript, Prisma & PostgreSQL — from zero to deployed product",
      category: "Development",
      level: "BEGINNER",
      price: 89.99,
      instructorEmail: "sarah@learnhub.dev",
      gradient: "from-indigo-500 via-violet-500 to-purple-600",
      rating: 4.8,
      ratingCount: 2841,
      lessons: [
        "Course Orientation & Roadmap", "HTML & CSS Deep Dive", "Modern JavaScript Essentials",
        "Async JS: Promises & Fetch", "TypeScript Fundamentals", "React Components & Hooks",
        "State Management Patterns", "Next.js App Router Mastery", "API Routes & Server Actions",
        "Databases with Prisma & SQLite", "Authentication Systems", "Deployment & CI/CD",
        "Capstone Project: Build a SaaS", "Career Module: Portfolio & Interviews",
      ],
    },
    {
      title: "Payment Systems Architecture: Build a Scalable Ledger",
      subtitle: "Design double-entry ledgers, idempotent payments and reconciliation like Stripe engineers",
      category: "Development",
      level: "ADVANCED",
      price: 129.99,
      instructorEmail: "sarah@learnhub.dev",
      gradient: "from-slate-700 via-slate-800 to-indigo-900",
      rating: 4.9,
      ratingCount: 812,
      lessons: [
        "Why Ledgers Beat Balances", "Double-Entry Accounting for Engineers", "Modeling Money: Integers & Currencies",
        "Idempotency Keys in Depth", "Transaction Isolation & Concurrency", "Designing the Entry Schema",
        "Reconciliation Pipelines", "Handling Refunds & Chargebacks", "Payouts & Settlement Engines",
        "Financial Reporting Queries", "Case Study: Stripe's Ledger", "Testing Money Movement",
      ],
    },
    {
      title: "Machine Learning A-Z: Hands-On Python & scikit-learn",
      subtitle: "From regression to gradient boosting — build 12 real ML projects with clean datasets",
      category: "Data Science",
      level: "INTERMEDIATE",
      price: 94.99,
      instructorEmail: "diego@learnhub.dev",
      gradient: "from-teal-400 via-cyan-500 to-sky-600",
      rating: 4.7,
      ratingCount: 1932,
      lessons: [
        "ML Landscape & Workflow", "Pandas Power User", "Visualization for Insight",
        "Linear & Logistic Regression", "Decision Trees & Random Forests", "Gradient Boosting with XGBoost",
        "Model Evaluation & Leakage", "Feature Engineering Lab", "Clustering & Dimensionality Reduction",
        "Neural Network Primer", "Deploying Models as APIs", "Final Project: Churn Prediction",
      ],
    },
    {
      title: "Deep Learning with PyTorch: Zero to Production",
      subtitle: "Train, fine-tune and serve transformer models — includes MLOps fundamentals",
      category: "Data Science",
      level: "ADVANCED",
      price: 119.99,
      instructorEmail: "diego@learnhub.dev",
      gradient: "from-orange-400 via-amber-500 to-yellow-600",
      rating: 4.8,
      ratingCount: 934,
      lessons: [
        "Tensors & Autograd", "Building Neural Nets from Scratch", "CNNs for Vision",
        "Transfer Learning Playbook", "Transformers & Attention", "Fine-Tuning LLMs",
        "Experiment Tracking", "Serving with TorchServe", "Monitoring Model Drift",
        "Capstone: Image Search Engine",
      ],
    },
    {
      title: "UX Design Masterclass: Research to Design Systems",
      subtitle: "User interviews, wireframing, prototyping and a complete design system in Figma",
      category: "Design",
      level: "BEGINNER",
      price: 69.99,
      instructorEmail: "amina@learnhub.dev",
      gradient: "from-rose-400 via-pink-500 to-fuchsia-600",
      rating: 4.9,
      ratingCount: 1567,
      lessons: [
        "What Great UX Really Means", "Research Methods That Ship", "Synthesizing Insights",
        "Information Architecture", "Wireframing Sprint", "Visual Hierarchy & Type",
        "Color Systems in Practice", "Component Libraries in Figma", "Prototyping & Handoff",
        "Accessibility Foundations", "Portfolio Case Study Workshop",
      ],
    },
    {
      title: "Design Systems at Scale: Tokens, Components, Governance",
      subtitle: "The complete playbook for multi-product design systems used by fintech teams",
      category: "Design",
      level: "INTERMEDIATE",
      price: 109.99,
      instructorEmail: "amina@learnhub.dev",
      gradient: "from-fuchsia-500 via-purple-500 to-indigo-600",
      rating: 4.7,
      ratingCount: 621,
      lessons: [
        "System Thinking for Design", "Token Architecture", "Semantic vs Core Tokens",
        "Component API Design", "Documentation That Converts", "Versioning & Deprecation",
        "Cross-Team Governance", "Measuring Adoption", "Case Study: Shopify Polaris",
      ],
    },
    {
      title: "云原生架构实战：Kubernetes 与 AWS 生产部署",
      subtitle: "从容器化到高可用集群 — 生产级云原生系统完整指南",
      category: "IT & Software",
      level: "INTERMEDIATE",
      price: 99.99,
      instructorEmail: "kenji@learnhub.dev",
      gradient: "from-blue-600 via-indigo-600 to-violet-700",
      rating: 4.8,
      ratingCount: 1103,
      lessons: [
        "云原生入门与心智模型", "Docker 容器化实战", "Kubernetes 核心概念",
        "Pod 与调度策略", "服务发现与负载均衡", "存储与有状态应用",
        "自动化扩缩容 HPA", "可观测性：日志、指标、追踪", "安全与网络策略",
        "GitOps 与 CI/CD 流水线", "故障演练与高可用设计", "综合项目：电商平台上云",
      ],
    },
    {
      title: "AWS Solutions Architect: SAA-C03 Complete Prep",
      subtitle: "Pass the AWS exam with 18 hours of labs, cheat sheets & 400 practice questions",
      category: "IT & Software",
      level: "INTERMEDIATE",
      price: 84.99,
      instructorEmail: "kenji@learnhub.dev",
      gradient: "from-amber-400 via-orange-500 to-red-500",
      rating: 4.6,
      ratingCount: 2418,
      lessons: [
        "Exam Domains & Strategy", "IAM Deep Dive", "S3 & Storage Tiers",
        "VPC Networking Mastery", "EC2 & Auto Scaling", "RDS & Aurora",
        "Lambda & Serverless", "Route 53 & CloudFront", "Security & Compliance",
        "Cost Optimization", "Resilience Architecture", "Full Practice Exams",
      ],
    },
    {
      title: "Digital Marketing Analytics: Growth Loops & Attribution",
      subtitle: "Measure what matters — GA4, Mixpanel, cohort analysis and CAC/LTV modeling",
      category: "Marketing",
      level: "BEGINNER",
      price: 59.99,
      instructorEmail: "sarah@learnhub.dev",
      gradient: "from-emerald-400 via-green-500 to-teal-600",
      rating: 4.5,
      ratingCount: 763,
      lessons: [
        "The Growth Analytics Stack", "Event Tracking Design", "GA4 Without Tears",
        "Funnels & Cohorts", "Attribution Models Compared", "CAC & LTV Modeling",
        "A/B Testing Foundations", "Dashboards That Drive Decisions", "Capstone: Growth Audit",
      ],
    },
    {
      title: "Startup Finance for Founders: Cap Tables to Runway",
      subtitle: "Equity, dilution, unit economics and investor-ready financial modeling",
      category: "Business",
      level: "BEGINNER",
      price: 74.99,
      instructorEmail: "amina@learnhub.dev",
      gradient: "from-cyan-500 via-sky-500 to-blue-600",
      rating: 4.6,
      ratingCount: 489,
      lessons: [
        "Founder Financial Literacy", "Cap Tables Step by Step", "Dilution Scenarios",
        "Unit Economics & Contribution Margin", "Modeling 24-Month Runway", "Fundraise Math",
        "Term Sheets Decoded", "Investor Update Templates", "Exit Modeling Basics",
      ],
    },
  ];

  const courseIds: Record<string, { id: string; price: number; instructorId: string }> = {};
  for (const c of courseData) {
    const durationPerLesson = randInt(14, 32);
    const course = await db.course.create({
      data: {
        title: c.title,
        subtitle: c.subtitle,
        description: `${c.subtitle}.\n\nThis is a project-based course. Every module ends with a hands-on exercise, and by the end you'll have portfolio-grade artifacts you can show employers. Includes lifetime access, caption support in 12 languages, and a private community of peers.\n\nWhat you'll get:\n- ${c.lessons.length} focused lessons (${Math.round((c.lessons.length * durationPerLesson) / 60)}+ hours)\n- Downloadable resources & source code\n- Certificate of completion\n- 30-day money-back guarantee`,
        category: c.category,
        level: c.level,
        price: c.price,
        language: c.instructorEmail === "kenji@learnhub.dev" ? "中文" : "English",
        coverGradient: c.gradient,
        status: "PUBLISHED",
        durationMinutes: c.lessons.length * durationPerLesson,
        lessonsCount: c.lessons.length,
        rating: c.rating,
        ratingCount: c.ratingCount,
        instructorId: instructors[c.instructorEmail],
        createdAt: daysAgo(randInt(200, 420)),
      },
    });
    courseIds[course.id] = { id: course.id, price: c.price, instructorId: instructors[c.instructorEmail] };

    let lessonOrder = 0;
    for (const title of c.lessons) {
      lessonOrder++;
      await db.lesson.create({
        data: {
          courseId: course.id,
          title,
          durationMinutes: durationPerLesson,
          order: lessonOrder,
          isPreview: lessonOrder <= 2,
          videoUrl: SAMPLE_VIDEOS[(lessonOrder - 1) % SAMPLE_VIDEOS.length],
        },
      });
    }
  }

  console.log("Creating transactions (~6 months of sales)...");
  const courseList = Object.values(courseIds);
  let txCount = 0;
  const createdTx: { id: string; instructorId: string; net: number; studentId: string; courseId: string; gross: number; fee: number; createdAt: Date }[] = [];

  // Main instructor (Sarah) gets a bulk of sales so her ledger is rich
  const weightFor = (course: { instructorId: string }) =>
    course.instructorId === instructors["sarah@learnhub.dev"] ? 3 : 1;

  const weighted: typeof courseList = [];
  for (const c of courseList) for (let w = 0; w < weightFor(c); w++) weighted.push(c);

  const TARGET_TX = 210;
  for (let i = 0; i < TARGET_TX; i++) {
    const course = pick(weighted);
    const student = pick(students);
    // recency-weighted: more sales in recent months (growth)
    const daysBack = Math.floor(Math.pow(rand(), 1.35) * 178);
    const createdAt = daysAgo(daysBack);

    // ~12% of sales at promotional discount
    const priceModifier = rand() < 0.12 ? pick([0.5, 0.6, 0.75]) : 1;
    const gross = round2(course.price * priceModifier);
    const fee = round2(gross * PLATFORM_FEE_RATE);
    const net = round2(gross - fee);

    const tx = await db.transaction.create({
      data: {
        type: "SALE",
        courseId: course.id,
        studentId: student.id,
        instructorId: course.instructorId,
        grossAmount: gross,
        platformFee: fee,
        netEarnings: net,
        status: "COMPLETED",
        description: priceModifier < 1 ? "Promotional price" : "Course purchase",
        createdAt,
      },
    });
    txCount++;
    createdTx.push({
      id: tx.id,
      instructorId: course.instructorId,
      net,
      studentId: student.id,
      courseId: course.id,
      gross,
      fee,
      createdAt,
    });

    await db.enrollment.create({
      data: {
        studentId: student.id,
        courseId: course.id,
        pricePaid: gross,
        progress: pick([0, 5, 12, 25, 30, 45, 55, 60, 72, 80, 90, 100]),
        createdAt,
      },
    }).catch(() => {}); // skip duplicates
  }

  console.log(`Created ${txCount} sale transactions`);

  console.log("Creating refunds...");
  // refund ~4% of Sarah's completed transactions (3-25 days after purchase)
  const sarahTx = createdTx.filter((t) => t.instructorId === instructors["sarah@learnhub.dev"] && t.createdAt < daysAgo(28));
  const refundCount = Math.max(4, Math.floor(sarahTx.length * 0.045));
  const shuffled = [...sarahTx].sort(() => rand() - 0.5).slice(0, refundCount);
  for (const t of shuffled) {
    const refundDate = new Date(t.createdAt);
    refundDate.setDate(refundDate.getDate() + randInt(3, 25));
    await db.transaction.update({ where: { id: t.id }, data: { status: "REFUNDED" } });
    await db.transaction.create({
      data: {
        type: "REFUND",
        courseId: t.courseId,
        studentId: t.studentId,
        instructorId: t.instructorId,
        grossAmount: -round2(t.gross),
        platformFee: -round2(t.fee),
        netEarnings: -round2(t.net),
        status: "COMPLETED",
        description: "Refund issued",
        refundReason: pick([
          "Not what I expected",
          "Duplicate purchase",
          "Found a different course",
          "Too advanced for my level",
          "Financial reasons",
        ]),
        relatedTransactionId: t.id,
        createdAt: refundDate,
      },
    });
    await db.enrollment.deleteMany({ where: { studentId: t.studentId, courseId: t.courseId } });
  }
  console.log(`Created ${shuffled.length} refunds`);

  console.log("Creating payouts (proportional to actual earnings)...");
  // compute each instructor's actual net earnings so payouts always leave a positive balance
  const grouped = await db.transaction.groupBy({
    by: ["instructorId"],
    _sum: { netEarnings: true },
  });
  const netByInstructor = new Map(grouped.map((g) => [g.instructorId, g._sum.netEarnings || 0]));
  const netOf = (email: string) => netByInstructor.get(instructors[email]) || 0;

  const payoutSeed: {
    email: string;
    pct: number;
    method: string;
    status: string;
    days: number;
    note?: string;
  }[] = [
    // Sarah: 4 paid payouts (~64% of net) + 1 pending (~9%) -> healthy available balance
    { email: "sarah@learnhub.dev", pct: 0.2, method: "PAYPAL", status: "PAID", days: 150 },
    { email: "sarah@learnhub.dev", pct: 0.18, method: "BANK_TRANSFER", status: "PAID", days: 118 },
    { email: "sarah@learnhub.dev", pct: 0.16, method: "PAYPAL", status: "PAID", days: 87 },
    { email: "sarah@learnhub.dev", pct: 0.1, method: "PAYPAL", status: "PAID", days: 55 },
    { email: "sarah@learnhub.dev", pct: 0.09, method: "BANK_TRANSFER", status: "PENDING", days: 3 },
    // Diego
    { email: "diego@learnhub.dev", pct: 0.42, method: "PAYPAL", status: "PAID", days: 92 },
    { email: "diego@learnhub.dev", pct: 0.15, method: "STRIPE", status: "APPROVED", days: 6 },
    // Amina
    { email: "amina@learnhub.dev", pct: 0.4, method: "PAYPAL", status: "PAID", days: 70 },
    {
      email: "amina@learnhub.dev",
      pct: 0.12,
      method: "BANK_TRANSFER",
      status: "REJECTED",
      days: 12,
      note: "Payout method details could not be verified. Please update your payment info and re-request.",
    },
    // Kenji
    { email: "kenji@learnhub.dev", pct: 0.38, method: "PAYPAL", status: "PAID", days: 64 },
    { email: "kenji@learnhub.dev", pct: 0.1, method: "PAYPAL", status: "PENDING", days: 1 },
  ];
  for (const p of payoutSeed) {
    const amount = round2(netOf(p.email) * p.pct);
    if (amount < 5) continue; // skip dust
    await db.payout.create({
      data: {
        instructorId: instructors[p.email],
        amount,
        method: p.method,
        status: p.status,
        note: p.note ?? null,
        requestedAt: daysAgo(p.days),
        processedAt: ["PAID", "REJECTED", "APPROVED"].includes(p.status) ? daysAgo(Math.max(0, p.days - 2)) : null,
      },
    });
  }

  console.log("Recalculating course stats...");
  const allCourses = await db.course.findMany({ select: { id: true, language: true } });
  for (const c of allCourses) {
    const agg = await db.enrollment.aggregate({ where: { courseId: c.id }, _count: true });
    await db.course.update({ where: { id: c.id }, data: { studentsCount: agg._count } });
  }

  console.log("Creating lesson progress (consistent with enrollment progress)...");
  const allEnrollments = await db.enrollment.findMany({
    include: { course: { include: { lessons: { orderBy: { order: "asc" } } } } },
  });
  let progressRows = 0;
  for (const e of allEnrollments) {
    const lessons = e.course.lessons;
    if (!lessons.length) continue;
    const target = Math.min(lessons.length, Math.round((e.progress / 100) * lessons.length));
    for (let i = 0; i < target; i++) {
      await db.lessonProgress.create({
        data: { enrollmentId: e.id, lessonId: lessons[i].id },
      }).catch(() => {}); // unique guard
      progressRows++;
    }
    // snap enrollment progress to the exact lesson-derived percent
    const exact = Math.round((target / lessons.length) * 100);
    if (exact !== e.progress) {
      await db.enrollment.update({ where: { id: e.id }, data: { progress: exact } });
    }
  }
  console.log(`Created ${progressRows} lesson progress rows`);

  console.log("Creating reviews...");
  const reviewTemplates = [
    "Exactly what I needed. The instructor explains complex ideas in a way that finally clicked for me.",
    "Great pacing and real-world examples. I shipped my first project halfway through the course.",
    "One of the best-structured courses I've taken. Every lesson builds on the previous one.",
    "The project work alone is worth the price. Highly recommended for anyone serious about leveling up.",
    "Clear, concise and practical. The downloadable resources saved me hours of setup.",
    "I was skeptical at first, but the depth here is impressive. The section on architecture is gold.",
    "Fantastic course. I went from confused to confident in about two weeks of evening study.",
    "Solid content with honest, battle-tested advice — not just theory from a textbook.",
    "The instructor answers questions fast and updates the material regularly. Money well spent.",
    "Good course overall. Some lessons could be longer, but the exercises make up for it.",
    "The explanations are clear and the examples are realistic. Exactly the practical depth I wanted.",
    "Landed a junior role two weeks after finishing the capstone. This course was the difference.",
  ];
  const reviewTemplatesZh = [
    "讲得非常清楚，复杂的概念也能轻松理解。强烈推荐！",
    "课程结构设计得很好，每个章节都环环相扣，收获很大。",
    "实战性很强，跟着做完项目直接用到了公司生产环境。",
    "老师讲解到位，配套资源也很实用，物超所值。",
    "内容扎实，更新及时，遇到的疑问都能在课程中找到答案。",
  ];
  let reviewCount = 0;
  for (const c of allCourses) {
    const enrolled = await db.enrollment.findMany({
      where: { courseId: c.id },
      include: { student: true },
      orderBy: { createdAt: "asc" },
    });
    // up to 5 reviews per course from enrolled students
    const reviewers = enrolled.slice(0, 5);
    const isZh = c.language === "中文";
    for (const e of reviewers) {
      if (rand() < 0.25) continue; // not everyone reviews
      const rating = rand() < 0.82 ? pick([5, 5, 5, 4]) : 3;
      const pool = isZh ? reviewTemplatesZh : reviewTemplates;
      const reviewDate = new Date(e.createdAt);
      reviewDate.setDate(reviewDate.getDate() + randInt(3, 40));
      if (reviewDate > new Date()) reviewDate.setDate(new Date().getDate() - randInt(1, 10));
      await db.review.create({
        data: {
          courseId: c.id,
          studentId: e.student.id,
          rating,
          comment: pick(pool),
          createdAt: reviewDate,
        },
      }).catch(() => {});
      reviewCount++;
    }
  }
  console.log(`Created ${reviewCount} reviews`);

  console.log("Creating wishlists...");
  let wishlistCount = 0;
  for (const s of students) {
    const enrolledCourseIds = new Set(
      (await db.enrollment.findMany({ where: { studentId: s.id }, select: { courseId: true } })).map((e) => e.courseId),
    );
    const notEnrolled = courseList.filter((c) => !enrolledCourseIds.has(c.id));
    const wishes = Math.min(notEnrolled.length, randInt(1, 3));
    const shuffledWish = [...notEnrolled].sort(() => rand() - 0.5).slice(0, wishes);
    for (const c of shuffledWish) {
      await db.wishlist.create({
        data: { studentId: s.id, courseId: c.id, createdAt: daysAgo(randInt(2, 45)) },
      }).catch(() => {});
      wishlistCount++;
    }
  }
  console.log(`Created ${wishlistCount} wishlist items`);

  console.log("Creating demo coupons...");
  const sarahId = instructors["sarah@learnhub.dev"];
  const aminaId = instructors["amina@learnhub.dev"];
  const courseListArr = Object.entries(courseIds);
  const couponData = [
    { code: "WELCOME25", percentOff: 25, description: "Storewide welcome offer — 25% off any course", courseId: null, maxUses: 500, createdBy: sarahId, expiresAt: null },
    { code: "LEARN10", percentOff: 10, description: "Storewide — 10% off your cart", courseId: null, maxUses: 300, createdBy: sarahId, expiresAt: null },
    { code: "MLLAUNCH40", percentOff: 40, description: "ML A-Z launch promo — 40% off this course", courseId: courseListArr.find(([, v]) => v.price === 94.99)?.[0] ?? null, maxUses: 100, createdBy: instructors["diego@learnhub.dev"], expiresAt: null },
    { code: "DESIGN15", percentOff: 15, description: "UX Design Masterclass — 15% off", courseId: courseListArr.find(([, v]) => v.price === 69.99)?.[0] ?? null, maxUses: 80, createdBy: aminaId, expiresAt: null },
    { code: "BLACKFRIDAY50", percentOff: 50, description: "Expired Black Friday blitz", courseId: null, maxUses: 200, createdBy: sarahId, expiresAt: daysAgo(120) },
  ];
  for (const cp of couponData) {
    await db.coupon.create({
      data: {
        code: cp.code,
        percentOff: cp.percentOff,
        description: cp.description,
        courseId: cp.courseId,
        maxUses: cp.maxUses,
        usedCount: randInt(3, 40),
        active: true,
        expiresAt: cp.expiresAt,
        createdBy: cp.createdBy,
        createdAt: daysAgo(randInt(30, 90)),
      },
    }).catch(() => {});
  }
  console.log(`Created ${couponData.length} coupons (WELCOME25 · LEARN10 · MLLAUNCH40 · DESIGN15 · BLACKFRIDAY50-expired)`);

  const userCount = await db.user.count();
  const courseCount = await db.course.count();
  const reviewTotal = await db.review.count();
  console.log(`Done. Users: ${userCount}, Courses: ${courseCount}, Transactions: ${txCount + shuffled.length}, Reviews: ${reviewTotal}`);
  console.log("Demo logins: admin@learnhub.dev / sarah@learnhub.dev / diego@learnhub.dev / amina@learnhub.dev / kenji@learnhub.dev / liam@student.dev — password: demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
