import './globals.css';

export const metadata = {
  title: 'Unialfa · Sistema de Alunos',
  description: 'Cadastro de alunos com autenticação por token de acesso',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
