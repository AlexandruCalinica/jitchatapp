import { useState } from "react";
import { useAuth } from "../contexts/auth";
import Editor from "../components/Editor/Editor";
import { ChannelsLayout } from "../components/ChannelsLayout/Layout";

export function Home() {
  const { user } = useAuth();
  const [draftMode] = useState<"always" | "default">("default");

  const editorUser = {
    id: user?.id ?? "",
    username: user?.username ?? "anonymous",
    color: user?.color ?? "#000000",
    avatar_url: user?.avatar_url ?? null,
  };

  return (
    <ChannelsLayout>
      <div className="flex-1 overflow-y-auto h-full" data-scroll-container>
        <Editor
          user={editorUser}
          documentId="doc_avarh0wicwaeg1dj"
          namespace="main"
          useYjs
          draftMode={draftMode}
          textBlur={{
            unlockKey: "Alt",
            blurAmount: "3px",
            showIndicator: true,
          }}
        />
      </div>
    </ChannelsLayout>
  );
}
