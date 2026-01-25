import { AccountSwitcher } from "../AccountSwitcher/AccountSwitcher";

export const ContextBar = () => {
  return (
    <div className="h-8 py-1 flex items-center justify-between px-4 bg-gray-25">
      <div className="flex items-center gap-2">
        <h2 className="text-md font-medium text-gray-900">
          19 Jan 2025 <span className="text-gray-900 font-light">(#channel1)</span>
        </h2>
      </div>
      <div>
        <AccountSwitcher />
      </div>
    </div>
  );
};
