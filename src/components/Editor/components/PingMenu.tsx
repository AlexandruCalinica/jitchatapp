import { useState, useEffect, useRef } from "react";
import clsx from "clsx";

import { Avatar } from "../../Avatar/Avatar";
import { PresenceUser } from "../shared/followTypes";

interface PingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: PresenceUser[];
  onSendPing: (targets: string[] | "all") => void;
  position?: { x: number; y: number };
  currentDocId?: string | null;
}

export function PingMenu({
  isOpen,
  onClose,
  onlineUsers,
  onSendPing,
  position,
  currentDocId,
}: PingMenuProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserIds(new Set());
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleBroadcast = () => {
    onSendPing("all");
    onClose();
  };

  const handleSendToSelected = () => {
    if (selectedUserIds.size > 0) {
      onSendPing(Array.from(selectedUserIds));
      onClose();
    }
  };

  if (!isOpen) return null;

  const style: React.CSSProperties = position
    ? {
        position: "fixed",
        left: position.x,
        top: position.y,
      }
    : {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      };

  return (
    <div
      ref={menuRef}
      style={style}
      className="bg-zed-bg border border-zed-border rounded-lg shadow-lg min-w-[240px] p-2 z-50"
    >
      <div className="text-sm font-medium text-zed-fg mb-2 px-2">
        Ping to Follow
      </div>

      {onlineUsers.length === 0 ? (
        <div className="text-sm text-zed-muted px-2 py-3">
          No other users online
        </div>
      ) : (
        <>
          <button
            onClick={handleBroadcast}
            className={clsx(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left",
              "hover:bg-zed-active text-zed-fg transition-colors"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-zed-muted/20 flex items-center justify-center text-xs">
              {onlineUsers.length}
            </div>
            <span>Broadcast to All</span>
          </button>

          <div className="h-px bg-zed-border my-1.5" />

          <div className="max-h-[200px] overflow-y-auto">
            {onlineUsers.map((user) => {
              const isInDifferentDoc = currentDocId && user.current_doc_id && user.current_doc_id !== currentDocId;
              return (
                <button
                  key={user.user_id}
                  onClick={() => handleToggleUser(user.user_id)}
                  className={clsx(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left",
                    "hover:bg-zed-active transition-colors",
                    selectedUserIds.has(user.user_id) && "bg-zed-active"
                  )}
                >
                  <div
                    className={clsx(
                      "w-4 h-4 rounded border flex items-center justify-center",
                      selectedUserIds.has(user.user_id)
                        ? "bg-zed-blue border-zed-blue"
                        : "border-zed-border"
                    )}
                  >
                    {selectedUserIds.has(user.user_id) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: user.color }}
                  />
                  <Avatar size="xs" name={user.username} />
                  <span className="text-zed-fg truncate flex-1">{user.username}</span>
                  {isInDifferentDoc && (
                    <span className="text-xs text-zed-muted">other doc</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedUserIds.size > 0 && (
            <>
              <div className="h-px bg-zed-border my-1.5" />
              <button
                onClick={handleSendToSelected}
                className={clsx(
                  "w-full px-2 py-1.5 rounded-md text-sm text-center",
                  "bg-zed-blue text-white hover:bg-zed-blue/90 transition-colors"
                )}
              >
                Send Ping ({selectedUserIds.size})
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
