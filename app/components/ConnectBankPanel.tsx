import PlaidConnectButton from "./PlaidConnectButton";

export default function ConnectBankPanel() {
  return (
    <section className="mt-6 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Bank Connection</h2>
      <p className="mt-2 text-sm text-gray-600">
        Plaid connection controls will go here next.
      </p>
      <PlaidConnectButton />
    </section>
  );
}