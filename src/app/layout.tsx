import type { Metadata } from "next";
import { Geist, Lora, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";
import "./redesign.css";
import "./gallery.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const serif = Lora({ subsets: ["latin"], variable: "--font-serif" });
const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], variable: "--font-kannada" });

export const metadata: Metadata = {
  title: { default: "Morarji Desai Residential School Alumni", template: "%s | MDRS Alumni" },
  description: "The digital home of Morarji Desai Residential School alumni in Doddabadagere, Karnataka—preserving stories, events and community connections since 1997.",
  openGraph: { title: "Morarji Desai Residential School Alumni", description: "A digital home for generations of students and alumni.", type: "website", locale: "en_IN" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" data-scroll-behavior="smooth" className={`${sans.variable} ${serif.variable} ${kannada.variable}`}><body>{children}</body></html>;
}
