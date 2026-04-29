import ConnectBankPanel from "../components/ConnectBankPanel";

export default function ConnectBankPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Connect Bank</h1>
      <p className="mt-2">Temporary Plaid connection page.</p>
      <ConnectBankPanel />
    </main>
  );
}