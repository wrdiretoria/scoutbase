import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meu Craque — Perfil Oficial de Atleta de Futebol",
  description: "Crie seu perfil gratuito, receba avaliações de treinadores certificados e seja descoberto por scouts e clubes de todo o Brasil.",
  keywords: [
    "perfil atleta futebol", "scout futebol brasil", "avaliação atleta",
    "futebol de base", "ser descoberto futebol", "ranking atletas",
    "treinador futebol", "meu craque",
  ],
  authors: [{ name: "Meu Craque" }],
  metadataBase: new URL("https://meucraque.com.br"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://meucraque.com.br",
    siteName: "Meu Craque",
    title: "Meu Craque — Perfil Oficial de Atleta de Futebol",
    description: "Crie seu perfil gratuito e seja descoberto por scouts e clubes de todo o Brasil.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Meu Craque — Perfil Oficial de Atleta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meu Craque — Perfil Oficial de Atleta",
    description: "Crie seu perfil e seja descoberto por scouts e clubes.",
    images: ["/og-default.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meu Craque",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${bebasNeue.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-dm-sans)]">
        {children}
      </body>
    </html>
  );
}