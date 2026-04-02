import { LoginSignupPopup } from "./auth/login-signup-popup";
import { AuthButton } from "./auth-button";
import { UserMenu } from "./user-menu";

export const AuthLayout = () => {
  // TODO: Show auth menu when user is not logged in and show user menu when user is logged in
  // Check if user is logged in using useGetUser hook, implement after
  return (
    <>
      <AuthButton />
      <LoginSignupPopup />
      {/* <UserMenu /> */}
    </>
  );
};
