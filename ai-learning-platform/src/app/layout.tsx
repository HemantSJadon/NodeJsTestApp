import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSB Lecturette Prep | AI-Powered Defence Officer Training",
  description:
    "Complete AI-powered preparation platform for SSB and CDS Lecturette rounds. 203 topics, 6-phase training system, real-time grading.",
  keywords: ["SSB", "CDS", "Lecturette", "Defence", "Preparation", "UPSC"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
