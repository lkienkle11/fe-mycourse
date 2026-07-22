/**
 * Browser-bound media caller singletons.
 */

import { browserApiMethods } from "@/api/transport/browser-api-methods";
import { createMediaCallers } from "./media-factory";

const browserMediaCallers = createMediaCallers(browserApiMethods);

export const listMediaFiles = browserMediaCallers.listMediaFiles;
export const uploadMediaFiles = browserMediaCallers.uploadMediaFiles;
export const deleteMediaFile = browserMediaCallers.deleteMediaFile;
