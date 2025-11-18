import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
// 1. Import the ProtectedLayout
import ProtectedLayout from "@/components/ProtectedLayout";

export const metadata: Metadata = {
  title: "Mary's Wedding",
  description: "A beautiful wedding website with modern glassmorphism design",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthProvider>
          {/* 2. Wrap children in ProtectedLayout to enforce authentication */}
          <ProtectedLayout>{children}</ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
