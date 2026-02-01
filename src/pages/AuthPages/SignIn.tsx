import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | The Tip Top - Restaurant Admin Panel"
        description="Sign in to The Tip Top Restaurant Admin Panel"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
