'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import Navbar from "../../components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const noNavRoutes = ['/login', '/register'];
  const showNav = !noNavRoutes.includes(pathname);

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {showNav && <Navbar />}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}