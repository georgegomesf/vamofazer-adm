import { auth } from "@/auth";

export default async function AdmPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-2">{session?.user?.name}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Você está na nova área administrativa da Rede Filosófica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <h3 className="font-semibold mb-2 text-gray-800 dark:text-white/90">Dados da Sessão</h3>
          <pre className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
