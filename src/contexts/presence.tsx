import { createContext, useContext, ReactNode } from "react";
import { usePresenceChannel } from "../hooks/useChannel";

type PresenceContextType = {
  presentUsers: {
    user_id: string;
    username: string;
    color: string;
    avatar_url: string | null;
    current_doc_id: string | null;
    online_at: number;
  }[];
};

const PresenceContext = createContext<PresenceContextType>({
  presentUsers: [],
});

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { presentUsers } = usePresenceChannel("leads:all");

  return (
    <PresenceContext.Provider value={{ presentUsers }}>
      {children}
    </PresenceContext.Provider>
  );
};
