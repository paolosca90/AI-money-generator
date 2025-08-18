import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { itIT } from "@clerk/localizations";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { clerkPublishableKey } from "./config";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Trade from "./pages/Trade";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";

const queryClient = new QueryClient();

if (!clerkPublishableKey) {
  throw new Error("Manca la chiave pubblicabile di Clerk. Controlla il tuo file frontend/config.ts");
}

function App() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      navigate={(to) => navigate(to)}
      localization={itIT}
    >
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/login/*" element={<Login />} />
          <Route path="/signup/*" element={<Signup />} />
          <Route
            path="/*"
            element={
              <>
                <SignedIn>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/trade" element={<Trade />} />
                      <Route path="/history" element={<History />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/billing" element={<Billing />} />
                    </Routes>
                  </Layout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
        </Routes>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
