import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { FollowIndicator } from "../components/FollowIndicator";
import { useFollowChannelOptional } from "../contexts/FollowChannelContext";
import { useChannelsContext } from "../../../contexts/channels";

interface FollowModePluginProps {
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function FollowModePlugin({ containerRef }: FollowModePluginProps) {
  const [editor] = useLexicalComposerContext();
  const followContext = useFollowChannelOptional();
  const { selectDocument } = useChannelsContext();
  const lastProcessedScrollEventId = useRef(0);
  const lastProcessedDocSwitchEventId = useRef(0);
  const isUserScrolling = useRef(false);
  const lastScrollTime = useRef(0);

  useEffect(() => {
    if (!followContext?.followState.isFollowing || !followContext.lastScrollEvent) {
      return;
    }

    const { payload, eventId } = followContext.lastScrollEvent;

    if (eventId <= lastProcessedScrollEventId.current) {
      return;
    }

    lastProcessedScrollEventId.current = eventId;

    if (isUserScrolling.current) {
      return;
    }

    if (payload.doc_id !== followContext.currentDocId) {
      return;
    }

    const scrollContainer = containerRef?.current?.closest('[data-scroll-container]') as HTMLElement | null
      ?? containerRef?.current?.parentElement as HTMLElement | null;

    if (scrollContainer) {
      lastScrollTime.current = Date.now();
      scrollContainer.scrollTo({
        top: payload.scroll_top,
        behavior: "smooth",
      });
    }
  }, [followContext?.lastScrollEvent, followContext?.followState.isFollowing, followContext?.currentDocId, containerRef]);

  useEffect(() => {
    if (!followContext?.followState.isFollowing || !followContext.lastDocSwitchEvent) {
      return;
    }

    const { payload, eventId } = followContext.lastDocSwitchEvent;

    if (eventId <= lastProcessedDocSwitchEventId.current) {
      return;
    }

    lastProcessedDocSwitchEventId.current = eventId;

    if (payload.doc_id && payload.doc_id !== followContext.currentDocId) {
      selectDocument(payload.doc_id);
    }
  }, [followContext?.lastDocSwitchEvent, followContext?.followState.isFollowing, followContext?.currentDocId, selectDocument]);

  useEffect(() => {
    if (!followContext?.followState.isFollowing) {
      lastProcessedScrollEventId.current = 0;
      lastProcessedDocSwitchEventId.current = 0;
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest('[data-follow-indicator]')) {
        return;
      }

      const rootElement = editor.getRootElement();
      if (rootElement && rootElement.contains(target)) {
        followContext.stopFollowing();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        followContext.stopFollowing();
      }
    };

    const handleScroll = () => {
      if (Date.now() - lastScrollTime.current > 100) {
        isUserScrolling.current = true;
        setTimeout(() => {
          isUserScrolling.current = false;
        }, 1000);
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    containerRef?.current?.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      containerRef?.current?.removeEventListener("scroll", handleScroll, true);
    };
  }, [editor, followContext, containerRef]);

  if (!followContext?.followState.isFollowing || !followContext.followState.followingUser) {
    return null;
  }

  return (
    <div data-follow-indicator>
      <FollowIndicator
        user={followContext.followState.followingUser}
        onStop={followContext.stopFollowing}
      />
    </div>
  );
}
