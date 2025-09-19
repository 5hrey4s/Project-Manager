'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { usePathname } from "next/navigation";
import Navbar from "../../components/Navbar";
import { AuthProvider } from "../../context/AuthContext";
import { CommandPalette } from "../../components/CommandPalette";

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
            <CommandPalette /> {/* Add the component here */}

        </AuthProvider>
      </body>
    </html>
  );
}