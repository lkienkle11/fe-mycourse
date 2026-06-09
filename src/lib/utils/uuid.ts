import { v7 as uuidv7 } from "uuid";

/** Client-generated entity id (taxonomy tree nodes, quiz option keys, etc.). */
export function newV7(): string {
  return uuidv7();
}
