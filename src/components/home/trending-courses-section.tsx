import { CourseCard, type CourseType } from "./course-card";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
// Mock data based on design
const TRENDING_COURSES: CourseType[] = [
  {
    id: "t1",
    title: "ChatGPT & Midjourney Mastery: AI Prompt Engineering",
    category: "AI",
    rating: 4.9,
    reviews: 4200,
    author: "AI Institute",
    duration: "12h 45m",
    lessons: 86,
    students: 35000,
    level: "Beginner",
    price: 29.99,
    originalPrice: 89.99,
  },
  {
    id: "t2",
    title: "Next.js 14 & React - The Complete Guide",
    category: "Development",
    rating: 4.8,
    reviews: 1250,
    author: "Maximilian S.",
    duration: "40h 20m",
    lessons: 280,
    students: 12400,
    level: "Intermediate",
    price: 64.99,
    originalPrice: 129.99,
  },
  {
    id: "t3",
    title: "Financial Modeling & Valuation Analyst (FMVA)",
    category: "Finance",
    rating: 4.7,
    reviews: 800,
    author: "CFI",
    duration: "55h 00m",
    lessons: 156,
    students: 4200,
    level: "Advanced",
    price: 199.99,
    originalPrice: 299.99,
  },
];

export async function TrendingCoursesSection() {
  const t = await getTranslations("homepage.trending");

  return (
    <section className="py-16 md:py-24 bg-muted/50 border-y">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4 px-3 py-1 bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
            <Flame className="w-4 h-4 mr-1" />
            {t("badge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TRENDING_COURSES.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
        
      </div>
    </section>
  );
}
