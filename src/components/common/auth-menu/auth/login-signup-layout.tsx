"use client";

import { MainLogo } from "@public/assets/icons/logo";
import bgLogin from "@public/assets/images/auth/bg-login.png";
import bgSignup from "@public/assets/images/auth/bg-signup.png";
import firstPerson from "@public/assets/images/jane-mycourse.png";
import secondPerson from "@public/assets/images/joe-kitanoe.png";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function LoginSignupLayout({
  type,
  className,
  children,
}: {
  type: "none" | "login" | "signup";
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("home");
  const tAuth = useTranslations("auth");
  if (type === "none") return null;

  return (
    <div
      className={cn(
        "flex justify-center items-stretch gap-0",
        "max-lg:flex-col",
        className,
      )}
    >
      {/* Desktop (lg+): hero stretches to match form column height */}
      <div className="relative w-1/2 basis-1/2 min-h-0 shrink-0 overflow-hidden rounded-tl-lg rounded-bl-lg max-lg:hidden">
        <div className="absolute flex justify-center items-center gap-2 left-3 bottom-6">
          <div className="w-[40px] h-[40px] rounded-full bg-white">
            <Image
              alt={
                type === "login"
                  ? tAuth("contentBonus.firstPerson.name")
                  : tAuth("contentBonus.secondPerson.name")
              }
              src={type === "login" ? firstPerson : secondPerson}
              className="w-full h-full object-cover rounded-full p-0.5"
              width={40}
              height={40}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-base text-white leading-[21px]">
              {type === "login"
                ? tAuth("contentBonus.firstPerson.name")
                : tAuth("contentBonus.secondPerson.name")}
            </span>
            <span className="font-normal text-sm leading-[18px] text-object-white/60">
              {type === "login"
                ? tAuth("contentBonus.firstPerson.role")
                : tAuth("contentBonus.secondPerson.role")}
            </span>
          </div>
        </div>
        <Image
          alt={type === "login" ? "Login background" : "Signup background"}
          src={type === "login" ? bgLogin : bgSignup}
          fill
          sizes="(min-width: 1024px) 50vw, 0px"
          className="object-cover"
        />
      </div>

      {/* Form: full width below lg; desktop sizes unchanged at lg+ */}
      <div
        className={cn(
          "w-1/2 basis-1/2 min-h-0 space-y-2.5 flex flex-col p-6 py-4 justify-center",
          "max-lg:w-full max-lg:basis-full max-lg:p-4 max-lg:py-4",
        )}
      >
        <div className="flex items-center justify-start gap-1.5 cursor-default select-none">
          <MainLogo />
          <h1 className="text-xl font-bold bg-black bg-clip-text text-transparent">
            {t("header.title")}
          </h1>
        </div>
        <span className="font-normal text-base leading-6 text-object-black/60 text-pretty">
          {tAuth("title")}
        </span>
        {children}
      </div>
    </div>
  );
}
