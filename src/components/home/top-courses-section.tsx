import { Button } from "@/components/ui/button";
import { CourseCard, type CourseType } from "./course-card";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

// Mock data based on design
const TOP_COURSES: CourseType[] = [
  {
    id: "1",
    title: "The Complete 2024 Web Development Bootcamp",
    category: "Development",
    rating: 4.8,
    reviews: 2451,
    author: "Dr. Angela Yu",
    duration: "65h 30m",
    lessons: 380,
    students: 15420,
    level: "All Levels",
    price: 89.99,
    originalPrice: 199.99,
  },
  {
    id: "2",
    title: "UI/UX Design Masterclass: Learn from Scratch",
    category: "Design",
    rating: 4.9,
    reviews: 1890,
    author: "Gary Simon",
    duration: "24h 15m",
    lessons: 142,
    students: 8300,
    level: "Beginner",
    price: 59.99,
    originalPrice: 129.99,
  },
  {
    id: "3",
    title: "Python for Data Science and Machine Learning",
    category: "Data Science",
    rating: 4.7,
    reviews: 3120,
    author: "Jose Portilla",
    duration: "42h 50m",
    lessons: 215,
    students: 22100,
    level: "Intermediate",
    price: 74.99,
    originalPrice: 149.99,
  },
  {
    id: "4",
    title: "Digital Marketing Strategy for 2024",
    category: "Marketing",
    rating: 4.6,
    reviews: 950,
    author: "Seth Godin",
    duration: "18h 20m",
    lessons: 85,
    students: 5400,
    level: "All Levels",
    price: 49.99,
  },
];

export async function TopCoursesSection() {
  const t = await getTranslations("homepage.topCourses");
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("description")}
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 font-medium hidden sm:flex"
          >
            {t("viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TOP_COURSES.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Button variant="outline" className="w-full font-medium">
            {t("viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
