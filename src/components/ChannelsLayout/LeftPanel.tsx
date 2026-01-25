import { PropsWithChildren } from "react";
import { Navigation } from "./Navigation";

export const LeftPanel = ({ children }: PropsWithChildren) => {
  return (
    <div className="w-[280px] h-full flex flex-col bg-gradient-to-b from-gray-100 to-gray-25">
      <div className="flex-none">
        <Navigation />
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {children}
      </div>
    </div>
  );
};
