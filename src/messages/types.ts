/** English messages shape (keys/nesting); values are strings in every locale. */
type DeepStringRecord<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DeepStringRecord<U>[]
    : T extends object
      ? { [K in keyof T]: DeepStringRecord<T[K]> }
      : never;

export type Messages = DeepStringRecord<typeof import("./en").default>;
