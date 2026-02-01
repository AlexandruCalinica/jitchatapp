import { useState } from "react";
import { useAuth } from "../contexts/auth";
import { useChannelsContext } from "../contexts/channels";
import Editor from "../components/Editor/Editor";
import { ChannelsLayout } from "../components/ChannelsLayout/Layout";
import { FollowChannelProvider } from "../components/Editor/contexts/FollowChannelContext";
import { FollowNotificationPlugin } from "../components/Editor/plugins/FollowNotificationPlugin";

export function Home() {
  const { user } = useAuth();
  const { selectedDocumentId, selectDocument, loading } = useChannelsContext();
  const [draftMode] = useState<"always" | "default">("default");

  const editorUser = {
    id: user?.id ?? "",
    username: user?.username ?? "anonymous",
    color: user?.color ?? "#000000",
    avatar_url: user?.avatar_url ?? null,
  };

  return (
    <ChannelsLayout>
      <FollowChannelProvider documentId={selectedDocumentId} onNavigateToDocument={selectDocument}>
        <FollowNotificationPlugin />
        <div className="flex-1 overflow-y-auto h-full" data-scroll-container>
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading...
            </div>
          ) : selectedDocumentId ? (
            <Editor
              key={selectedDocumentId}
              user={editorUser}
              documentId={selectedDocumentId}
              namespace="main"
              useYjs
              draftMode={draftMode}
              textBlur={{
                unlockKey: "Alt",
                blurAmount: "3px",
                showIndicator: true,
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a document to start editing
            </div>
          )}
        </div>
      </FollowChannelProvider>
    </ChannelsLayout>
  );
}
