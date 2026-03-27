import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Users, Star, BarChart } from "lucide-react";
import { getTranslations } from "next-intl/server";

export type CourseType = {
  id: string;
  title: string;
  category: string;
  rating: number;
  reviews: number;
  author: string;
  duration: string;
  lessons: number;
  students: number;
  level: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
};

interface CourseCardProps {
  course: CourseType;
}

export async function CourseCard({ course }: CourseCardProps) {
  const t = await getTranslations("homepage.courseCard");
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col bg-card border-border/50">
      <div className="relative aspect-video w-full bg-muted overflow-hidden">
        {/* Replace with actual Next Image when urls are available */}
        {course.imageUrl ? (
          <div className="w-full h-full bg-slate-200" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 group-hover:scale-105 transition-transform duration-500">
            <span className="font-medium text-sm">{t("image")}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm font-semibold hover:bg-background/100">
            {course.category}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="p-5 pb-0">
        <div className="flex items-center gap-1.5 text-sm font-medium mb-2 text-amber-500">
          <Star className="h-4 w-4 fill-current" />
          <span>{course.rating.toFixed(1)}</span>
          <span className="text-muted-foreground font-normal ml-1">({course.reviews})</span>
        </div>
        <h3 className="font-bold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 font-medium">{t("byAuthor")} {course.author}</p>
      </CardHeader>
      
      <CardContent className="p-5 flex-1">
        <div className="grid grid-cols-2 gap-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary/70" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary/70" />
            <span>{course.lessons} {t("lessons")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary/70" />
            <span>{course.students}</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart className="h-4 w-4 text-primary/70" />
            <span>{course.level}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-5 pt-0 mt-auto border-t border-border/50 flex items-center justify-between">
        <div className="flex flex-col mt-4">
          {course.originalPrice && (
            <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">
              ${course.originalPrice.toFixed(2)}
            </span>
          )}
          <span className="text-xl font-bold text-foreground">
            ${course.price.toFixed(2)}
          </span>
        </div>
        <div className="mt-4 text-primary font-semibold text-sm hover:underline cursor-pointer flex items-center">
          {t("enrollNow")}
        </div>
      </CardFooter>
    </Card>
  );
}
