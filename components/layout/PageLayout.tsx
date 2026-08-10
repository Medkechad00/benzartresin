import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar theme="dark" />
      <div className="min-h-screen pt-24 bg-white text-black">
        {children}
      </div>
      <Footer />
    </>
  );
}
