import './globals.css';

export const metadata = {
  title: 'Café Terrasse | Enovation Factory',
  description: 'Commandez depuis votre table',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}