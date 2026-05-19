import { Calendar, Clock, Video } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function UpcomingWebinarsSection() {
  const t = await getTranslations("homepage.webinar");

  const webinars = [
    {
      id: "w1",
      title: "Mastering React Server Components",
      host: "Dan Abramov",
      date: "Oct 24, 2024",
      time: "10:00 AM EST",
      duration: "45 min",
      tags: ["React", "Next.js"],
    },
    {
      id: "w2",
      title: "Building Scalable APIs with GraphQL",
      host: "Eve Green",
      date: "Nov 01, 2024",
      time: "1:00 PM EST",
      duration: "60 min",
      tags: ["Backend", "GraphQL"],
    },
    {
      id: "w3",
      title: "Advanced CSS Techniques for Modern Web Design",
      host: "Chris Lee",
      date: "Nov 10, 2024",
      time: "3:00 PM EST",
      duration: "50 min",
      tags: ["Frontend", "CSS"],
    },
  ];

  return (
    <section className="py-20 bg-background border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              {t("description")}
            </p>
          </div>
          <Button
            size="lg"
            variant="secondary"
            className="font-medium bg-white text-primary hover:bg-slate-100 hidden sm:flex"
          >
            {t("allWebinars")}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {webinars.map((webinar) => (
            <div
              key={webinar.id}
              className="relative group bg-card rounded-2xl border p-6 flex flex-col hover:shadow-lg transition-all hover:border-primary/30"
            >
              <div className="flex gap-2 flex-wrap mb-4">
                {webinar.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-primary/5 text-primary hover:bg-primary/10 border-none font-medium"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <h3 className="text-xl font-bold mb-6 line-clamp-2 leading-tight">
                {webinar.title}
              </h3>

              <div className="mt-auto space-y-4">
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-3 h-4 w-4 text-primary" />
                    <span>{webinar.date}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-3 h-4 w-4 text-primary" />
                    <span>
                      {webinar.time} • {webinar.duration}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Video className="mr-3 h-4 w-4 text-primary" />
                    <span>Live via Zoom</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-500">
                      {webinar.host.charAt(0)}
                    </div>
                    <div className="flex items-center text-sm font-medium">
                      <span className="text-muted-foreground mr-1">
                        {t("hostedBy")}
                      </span>{" "}
                      {webinar.host}
                    </div>
                  </div>
                  <Button className="w-full sm:w-auto font-medium shadow-sm">
                    {t("registerFree")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Button variant="outline" className="w-full font-medium">
            {t("allWebinars")}
          </Button>
        </div>
      </div>
    </section>
  );
}
