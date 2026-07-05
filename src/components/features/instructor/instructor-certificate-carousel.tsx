"use client";

import { PreviewPdf } from "@/components/shared/preview-pdf";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { InstructorCertificate } from "@/types/instructor";

export type InstructorCertificateCarouselProps = {
  certificates: InstructorCertificate[];
};

export function InstructorCertificateCarousel({
  certificates,
}: InstructorCertificateCarouselProps) {
  if (!certificates.length) return null;

  const showNav = certificates.length > 1;

  return (
    <div className="relative px-10">
      <Carousel opts={{ align: "start", loop: showNav }}>
        <CarouselContent>
          {certificates.map((cert) => (
            <CarouselItem
              key={`${cert.title}-${cert.issuer}-${cert.issued_year}-${cert.credential_url ?? ""}-${cert.certificate_file_id ?? ""}`}
            >
              <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-md border p-4 text-center">
                <div className="space-y-1">
                  <p className="font-medium">{cert.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {cert.issuer} · {cert.issued_year}
                  </p>
                </div>
                {cert.credential_url ? (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-full truncate text-sm text-primary underline"
                  >
                    {cert.credential_url}
                  </a>
                ) : null}
                {cert.certificate_file?.url ? (
                  <div className="w-full">
                    <PreviewPdf
                      url={cert.certificate_file.url}
                      title={cert.certificate_file.filename ?? cert.title}
                    />
                  </div>
                ) : null}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {showNav ? (
          <>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </>
        ) : null}
      </Carousel>
    </div>
  );
}
