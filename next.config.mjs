/** @type {import('next').NextConfig} */
const nextConfig = {
  // Módulo nativo: precisa ficar fora do bundle do Next (server side).
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
