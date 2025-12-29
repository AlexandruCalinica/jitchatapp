import { useState } from "react";

import { User } from "./types";

type ConfigState = {
  defaultDraft: boolean;
  collapseDraftParagraphs: boolean;
  currentUser: User | null;
};

export const configState: ConfigState = {
  defaultDraft: true,
  collapseDraftParagraphs: false,
  currentUser: null,
};

export const getConfigValue = (key: keyof ConfigState) => {
  return configState[key];
};

export const useConfigState = () => {
  const [config, _setConfig] = useState(() => configState);

  const setConfig = (newConfig: Partial<typeof configState>) => {
    Object.assign(configState, newConfig);
    _setConfig(configState);
  };

  return [config, setConfig] as const;
};
