import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <SignIn path="/login" routing="path" signUpUrl="/signup" />
    </div>
  );
}
