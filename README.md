This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Variables

Create a `.env` file at the project root (already included, gitignored):

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL for the backend API | `http://localhost:8080` |

The Axios instance at `src/api/instance.ts` reads `NEXT_PUBLIC_API_URL` as its `baseURL`.

---

## Low-level API Helpers (`src/api/methods.ts`)

Bốn hàm bọc Axios — `apiFetch`, `apiPost`, `apiPut`, `apiDelete` — đều trả về kiểu `ApiResult<T>` (định nghĩa trong `src/types/api.ts`):

```ts
interface ApiResult<T = unknown> {
  data: T;                          // parsed response body
  statusCode: number;               // HTTP status code (200, 201, 401, …)
  headers: Record<string, string>;  // response headers (set-cookie excluded)
  cookies: Record<string, string>;  // cookies parsed từ Set-Cookie header (name → raw value, attributes stripped)
}
```

### `headers`

Toàn bộ response header được flatten về `Record<string, string>`. Header có nhiều giá trị (array) được join bằng `", "`. `set-cookie` bị loại ra khỏi `headers` — truy cập qua `cookies` thay thế.

### `cookies`

Parse từ `Set-Cookie` response header. Mỗi entry `name=value; Path=/; HttpOnly` → `{ name: "value" }` (attributes bị strip). Hữu ích khi chạy trong Server Action / SSR — nơi browser không tự nhận `Set-Cookie` từ Axios mà cần relay thủ công.

### Ví dụ

```ts
const { data, statusCode, headers, cookies } = await apiPost<ApiResponse<null>>(
  "/auth/login",
  payload,
);

// cookies["access_token"] → raw token value từ Set-Cookie
// headers["x-request-id"] → trace ID từ server
```

> Caller không cần dùng `headers` / `cookies` thì destructure bình thường:
> ```ts
> const { data } = await apiFetch<ApiResponse<MeResponse>>("/me");
> ```

---

## Auth Flow (Login)

### Overview

```
LoginContent (client)
  → handleAuthSubmit("login", values)   [auth-form-handler.ts]
    → loginAction(payload)              [src/actions/auth/auth.ts — "use server"]
      → loginService(payload)           [src/services/auth/auth.ts]
        → apiPost(API_PUBLIC_ROUTES.auth.login, payload)
```

- **No API endpoint is exposed in the browser network tab** — the call goes through a Next.js Server Action (`"use server"`).
- **Tokens are never stored in JS**: BE sets `access_token`, `refresh_token`, `session_id` as `HttpOnly` cookies.
- **`data` in the response is always `null` on login success** — only `code` and `message` matter.

### Files Added / Modified

| File | Role |
|------|------|
| `.env` | `NEXT_PUBLIC_API_URL=http://localhost:8080` |
| `src/schema/auth/auth.ts` | Zod schemas: `loginSchema`, `signupSchema` + inferred types |
| `src/services/auth/auth.ts` | `loginService(payload)` — wraps `apiPost` |
| `src/actions/auth/auth.ts` | `loginAction(payload)` Server Action — calls loginService safely server-side |
| `src/components/…/auth-form-handler.ts` | `handleAuthSubmit(type, payload)` — single function used by both LoginContent & SignupContent |
| `src/components/…/login-content.tsx` | react-hook-form + zodResolver + loginAction wired up |
| `src/components/…/signup-content.tsx` | react-hook-form + zodResolver + signupAction wired up |

### Shared `handleAuthSubmit`

Both `LoginContent` and `SignupContent` call the same function:

```ts
handleAuthSubmit("login", loginValues)   // → loginAction
handleAuthSubmit("signup", signupValues) // → signupAction
```

The `type` discriminator determines which Server Action to invoke.

### Validation Messages (i18n)

Schema error messages use i18n keys (e.g. `"validation.email"`).  
Components call `t(error.message)` which resolves the key via `next-intl` against `src/messages/vi.json` / `en.json`.

---

## Auth Flow (Get Current User / Me)

### Overview

```
AuthLayout (client)
  → useAuth()                           [src/hooks/swr/auth/useAuth.ts — SWR]
    → getMeService()                    [src/services/auth/auth.ts]
      → apiFetch(getMeEndpointKey)      [GET /api/v1/me — cookie auth]
```

- **Cookie-based auth**: `withCredentials: true` trên Axios instance → cookie `access_token` được gửi tự động.
- **Transparent token refresh**: BE middleware tự gia hạn access_token nếu hết hạn (dùng refresh_token + session_id cookie), FE không cần xử lý thêm.
- **401 = chưa đăng nhập**: `getMeService` bắt lỗi 401 và trả về `null` thay vì throw, để SWR không báo lỗi.

### Conditional rendering trong `AuthLayout`

| Trạng thái | Hiển thị |
|-----------|---------|
| `isLoading = true` | Skeleton tròn 40×40 px animate-pulse |
| `me != null` | `<UserMenu me={me} />` với dữ liệu thật |
| `me == null` | `<AuthButton />` (nút đăng nhập / đăng ký) |

### Files Added / Modified

| File | Thay đổi |
|------|---------|
| `src/types/auth/auth.ts` | Thêm `MeResponse` interface (mirror BE dto/auth.go) |
| `src/services/auth/auth.ts` | Thêm `getMeEndpointKey` + `getMeService()` |
| `src/hooks/swr/auth/useAuth.ts` | Hook SWR trả về `{ me, isLoading, error, mutate }` |
| `src/components/…/auth-layout.tsx` | Logic hiển thị dựa trên state từ `useAuth` |
| `src/components/…/user-menu.tsx` | Nhận `me: MeResponse` props thay vì dùng DEFAULT_USER hardcoded |

### `MeResponse` type

Mirrors `be/dto/auth.go → MeResponse`:

```ts
interface MeResponse {
  user_id: number;
  user_code: string;
  email: string;
  display_name: string;
  avatar_url: string;
  email_confirmed: boolean;
  is_disabled: boolean;
  created_at: number;       // Unix timestamp
  permissions: string[];
}
```

### `useAuth` hook usage

```ts
const { me, isLoading, error, mutate } = useAuth();

// Sau khi login thành công — revalidate ngay lập tức:
await loginAction(payload);
mutate();
```

---

## Project Constants (`src/constants/`)

| File | Description |
|------|-------------|
| `common.ts` | Shared UI constants — `HEADER_DROPDOWN_ITEMS`, `LANGUAGE_OPTIONS`, and related types (`UserMenuItem`, `UserMenuGroup`). |
| `route.ts` | Application route paths — `ROUTES` object containing all named route strings (home, login, signup, …). |

## Auth Context (`src/context/auth/useAuthContext.tsx`)

The auth modal flow is managed by a single global state:

- `authAction: AuthActions` where `AuthActions = "none" | "login" | "signup" | "logout"`.
- `setAuthAction(action)` to switch auth state globally.
- `openLoginModal(nextPath?)` sets `authAction` to `"login"`.
- `openSignupModal(nextPath?)` sets `authAction` to `"signup"`.
- `closeAllModals()` resets state to `"none"` and clears `nextLink`.

Use `authAction === "login"` / `authAction === "signup"` when deciding which auth modal to render.
