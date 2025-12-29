import { createState } from "lexical";
import { User } from "../shared/types";

export const userState = createState<"user", User | undefined>("user", {
  parse: (json) => (typeof json === "string" ? JSON.parse(json) : json),
  unparse: (value) => JSON.stringify(value),
});

export const draftState = createState<"draft", boolean>("draft", {
  parse: (json) => (typeof json === "string" ? JSON.parse(json) : json),
  unparse: (value) => JSON.stringify(value),
});

export const timestampState = createState<"timestamp", number | undefined>(
  "timestamp",
  {
    parse: (json) => (typeof json === "string" ? JSON.parse(json) : json),
    unparse: (value) => JSON.stringify(value),
  }
);
