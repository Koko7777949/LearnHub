export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type Lang = "en" | "zh";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarColor: string;
  headline?: string | null;
  country?: string | null;
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  order: number;
  isPreview: boolean;
}

export interface CourseWithInstructor {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  price: number;
  language: string;
  coverGradient: string;
  status: string;
  durationMinutes: number;
  lessonsCount: number;
  rating: number;
  ratingCount: number;
  studentsCount: number;
  createdAt: string;
  updatedAt: string;
  instructorId: string;
  instructor: {
    id: string;
    name: string;
    headline?: string | null;
    bio?: string | null;
    avatarColor: string;
    country?: string | null;
  };
}

export interface EnrolledCourse {
  enrollmentId: string;
  progress: number;
  pricePaid: number;
  enrolledAt: string;
  course: CourseWithInstructor;
}

export interface StudentPurchase {
  id: string;
  type: string;
  grossAmount: number;
  status: string;
  createdAt: string;
  course: { id: string; title: string; coverGradient: string };
}

export interface LedgerTransaction {
  id: string;
  type: "SALE" | "REFUND";
  grossAmount: number;
  platformFee: number;
  netEarnings: number;
  status: string;
  description?: string | null;
  refundReason?: string | null;
  createdAt: string;
  course: { id: string; title: string; coverGradient: string };
  student: { id: string; name: string; avatarColor: string; country?: string | null };
}

export interface Payout {
  id: string;
  amount: number;
  method: string;
  status: string;
  note?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  instructor?: { id: string; name: string; avatarColor: string; email: string };
}

export interface MonthlyPoint {
  month: string;
  net: number;
  gross: number;
  fee: number;
}

export interface CourseBreakdown {
  courseId: string;
  title: string;
  coverGradient: string;
  sales: number;
  refunds: number;
  gross: number;
  net: number;
}

export interface LedgerSummary {
  lifetimeNet: number;
  availableBalance: number;
  pendingPayouts: number;
  grossSales: number;
  totalRefunds: number;
  platformFees: number;
  salesCount: number;
  netLast30: number;
  monthly: MonthlyPoint[];
  byCourse: CourseBreakdown[];
}

export interface AdminStats {
  gmv: number;
  platformRevenue: number;
  instructorEarnings: number;
  userCount: number;
  courseCount: number;
  enrollmentCount: number;
  pendingPayoutCount: number;
  gmvLast30: number;
  byCategory: { category: string; gross: number }[];
  monthly: MonthlyPoint[];
  recentTransactions: {
    id: string;
    type: string;
    grossAmount: number;
    platformFee: number;
    netEarnings: number;
    createdAt: string;
    course: { title: string };
    instructor: { name: string; avatarColor: string };
    student: { name: string; avatarColor: string };
  }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  country?: string | null;
  createdAt: string;
  courseCount?: number;
  enrollmentCount?: number;
}

export interface CourseReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  student: { id: string; name: string; avatarColor: string; country?: string | null };
}

export interface LearningLesson extends Lesson {
  completed: boolean;
}

export interface LearningData {
  course: CourseWithInstructor;
  lessons: LearningLesson[];
  enrollment: {
    enrollmentId: string;
    progress: number;
    enrolledAt: string;
  } | null;
  myReview?: CourseReview | null;
}

export interface WishlistEntry {
  courseId: string;
  createdAt: string;
  course: CourseWithInstructor;
}

export interface ProfileStats {
  enrollmentCount: number;
  completedCount: number;
  reviewCount: number;
  wishlistCount: number;
  courseCount: number;
  lifetimeNet: number;
  totalSpent: number;
}

export interface ProfileData {
  user: SessionUser & { bio?: string | null; createdAt: string };
  stats: ProfileStats;
}

/* ---------- coupons & cart ---------- */

export interface Coupon {
  id: string;
  code: string;
  percentOff: number;
  description?: string | null;
  courseId?: string | null;
  course?: { id: string; title: string } | null;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
  creator: { id: string; name: string; avatarColor: string };
}

export type CouponFailReason = "NOT_FOUND" | "INACTIVE" | "EXPIRED" | "MAX_USES" | "NOT_APPLICABLE";

export interface CouponValidation {
  valid: boolean;
  reason?: CouponFailReason;
  coupon?: {
    code: string;
    percentOff: number;
    description?: string | null;
    scopeCourseTitle?: string | null;
  };
  items?: { courseId: string; originalPrice: number; discountAmount: number }[];
  totalDiscount?: number;
}

export interface CheckoutResult {
  enrolled: { courseId: string; title: string; fullPrice: number; pricePaid: number }[];
  skippedOwned: { courseId: string; title: string }[];
  totals: { subtotal: number; discount: number; total: number };
  coupon?: { code: string; percentOff: number } | null;
}
