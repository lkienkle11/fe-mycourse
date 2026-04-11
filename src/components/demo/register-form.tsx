"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { http } from "@/lib/http";
import { useAppStore } from "@/store/use-app-store";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const t = useTranslations("home");
  const count = useAppStore((state) => state.count);
  const increment = useAppStore((state) => state.increment);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { trigger, isMutating } = useSWRMutation(
    "register-form-submit",
    async (_key: string, { arg }: { arg: RegisterInput }) => {
      // Keep axios instance wired and ready for real API integration.
      return Promise.resolve({
        ...arg,
        apiBaseUrl: http.defaults.baseURL ?? "",
      });
    },
  );

  const onSubmit = async (values: RegisterInput) => {
    await trigger(values);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle>{t("formTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <Button className="w-full" type="submit" disabled={isMutating}>
            {isMutating ? t("submitting") : t("submit")}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between rounded-md border p-3">
          <span className="text-sm">{t("zustandCount", { count })}</span>
          <Button type="button" variant="outline" onClick={increment}>
            {t("increment")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
