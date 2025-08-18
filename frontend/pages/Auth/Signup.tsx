import { SignUp } from "@clerk/clerk-react";

export default function Signup() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <SignUp 
        path="/signup" 
        routing="path" 
        signInUrl="/login"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
