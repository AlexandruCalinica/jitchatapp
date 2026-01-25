import { PropsWithChildren } from "react";
import { LeftPanel } from "./LeftPanel";
import { CenterPanel } from "./CenterPanel";
import { ChannelTreeView } from "./ChannelTreeView";

export const ChannelsLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <LeftPanel>
        <ChannelTreeView />
      </LeftPanel>
      <CenterPanel>
        {children}
      </CenterPanel>
    </div>
  );
};
