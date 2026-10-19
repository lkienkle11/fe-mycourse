"use client";

import instructorRecording from "@public/assets/images/home/hero/instructor-recording.webp";
import learnerComfortable from "@public/assets/images/home/hero/learner-comfortable.webp";
import tile1 from "@public/assets/images/home/hero/tile-1.webp";
import tile2 from "@public/assets/images/home/hero/tile-2.webp";
import tile3 from "@public/assets/images/home/hero/tile-3.webp";
import tile4 from "@public/assets/images/home/hero/tile-4.webp";
import tile5 from "@public/assets/images/home/hero/tile-5.webp";
import tile6 from "@public/assets/images/home/hero/tile-6.webp";
import tile7 from "@public/assets/images/home/hero/tile-7.webp";
import tile8 from "@public/assets/images/home/hero/tile-8.webp";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { HOME_HERO_AUTOPLAY_INTERVAL_MS } from "@/constants/home";
import {
  IMAGE_SIZES_HERO_PHOTO,
  IMAGE_SIZES_HERO_TILE,
} from "@/constants/seo/image";
import { useCarouselAutoplay } from "@/hooks/home/use-carousel-autoplay";
import { cn } from "@/lib/utils";

const HERO_TILES = [
  tile1,
  tile2,
  tile3,
  tile4,
  tile5,
  tile6,
  tile7,
  tile8,
] as const;

const SLIDE_HEIGHT_CLASS = "h-[320px] sm:h-[420px] lg:h-[542px]";
const SLIDE_COUNT = 3;

const textShadowClassName = "[text-shadow:0_2px_8px_rgba(0,0,0,0.35)]";

type HeroImageSource = (typeof HERO_TILES)[number];

function HeroSlideImage({
  src,
  sizes,
  priority,
}: {
  src: HeroImageSource;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt=""
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover"
    />
  );
}

/** Figma slides 2 and 3: a solid colour panel next to a photo (stacked on narrow screens). */
function HeroSplitSlide({
  image,
  panelClassName,
  imageFirst,
  headline,
  subheadline,
}: {
  image: HeroImageSource;
  panelClassName: string;
  imageFirst?: boolean;
  headline: string;
  subheadline: string;
}) {
  return (
    <div
      className={cn(
        "grid size-full grid-rows-[45%_55%] sm:grid-cols-[40%_60%] sm:grid-rows-1",
        imageFirst && "sm:grid-cols-[60%_40%]",
      )}
    >
      <div
        className={cn(
          "relative min-h-0 sm:min-w-0",
          imageFirst ? "order-1 sm:order-none" : "order-1 sm:order-2",
        )}
      >
        <HeroSlideImage src={image} sizes={IMAGE_SIZES_HERO_PHOTO} />
      </div>
      <div
        className={cn(
          "flex flex-col justify-center gap-3 px-6 text-white sm:px-12",
          imageFirst ? "order-2" : "order-2 sm:order-1",
          panelClassName,
        )}
      >
        <p
          className={cn(
            "text-2xl font-bold leading-tight sm:text-4xl lg:text-5xl",
            textShadowClassName,
          )}
        >
          {headline}
        </p>
        <p className="text-base sm:text-xl lg:text-2xl">{subheadline}</p>
      </div>
    </div>
  );
}

export function HeroCarousel() {
  const t = useTranslations("home.signedIn.hero");
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const sync = () => setSelected(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  useCarouselAutoplay(api, HOME_HERO_AUTOPLAY_INTERVAL_MS);

  const slideLabel = (index: number) =>
    t("slideLabel", { index: String(index), total: String(SLIDE_COUNT) });

  return (
    <div className="flex flex-col items-center gap-5">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        aria-label={t("label")}
        className="w-full cursor-grab overflow-hidden rounded-[10px] bg-neutral-300 active:cursor-grabbing"
      >
        <CarouselContent className="ml-0">
          <CarouselItem
            className={cn("relative pl-0", SLIDE_HEIGHT_CLASS)}
            aria-label={slideLabel(1)}
          >
            <div className="grid size-full grid-cols-4 grid-rows-2">
              {HERO_TILES.map((tile, tileIndex) => (
                <div key={tile.src} className="relative">
                  <HeroSlideImage
                    src={tile}
                    sizes={IMAGE_SIZES_HERO_TILE}
                    priority={tileIndex === 0}
                  />
                </div>
              ))}
            </div>
            <div
              className="absolute inset-0 bg-[#7a2e26]/60 mix-blend-multiply"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <h1
                className={cn(
                  "text-3xl font-bold leading-tight text-white sm:text-5xl sm:leading-[62px]",
                  textShadowClassName,
                )}
              >
                {t("headline")}
              </h1>
              <p className="font-gilroy text-base text-[rgba(249,249,249,0.9)] sm:text-2xl sm:leading-9">
                {t("subheadline")}
              </p>
            </div>
          </CarouselItem>
          <CarouselItem
            className={cn("relative pl-0", SLIDE_HEIGHT_CLASS)}
            aria-label={slideLabel(2)}
          >
            <HeroSplitSlide
              image={instructorRecording}
              panelClassName="bg-[#e6a700]"
              headline={t("instructor.headline")}
              subheadline={t("instructor.subheadline")}
            />
          </CarouselItem>
          <CarouselItem
            className={cn("relative pl-0", SLIDE_HEIGHT_CLASS)}
            aria-label={slideLabel(3)}
          >
            <HeroSplitSlide
              image={learnerComfortable}
              imageFirst
              panelClassName="bg-base-primary"
              headline={t("learner.headline")}
              subheadline={t("learner.subheadline")}
            />
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      <div className="flex items-center gap-1.5">
        {[...Array(SLIDE_COUNT).keys()].map((slideId) => (
          <button
            key={slideId}
            type="button"
            aria-label={t("goToSlide", { index: String(slideId + 1) })}
            aria-current={selected === slideId ? "true" : undefined}
            className={cn(
              "size-2 rounded-full transition-colors",
              selected === slideId ? "bg-base-primary" : "bg-neutral-300",
            )}
            onClick={() => api?.scrollTo(slideId)}
          />
        ))}
      </div>
    </div>
  );
}
