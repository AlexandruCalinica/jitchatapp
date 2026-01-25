import { PropsWithChildren } from "react";
import { ContextBar } from "./ContextBar";

export const CenterPanel = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-25 min-w-0">
      <ContextBar />
      <div className="flex-1 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
};
