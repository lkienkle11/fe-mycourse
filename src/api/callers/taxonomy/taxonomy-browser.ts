/**
 * Browser-bound taxonomy caller singletons.
 */

import { browserApiMethods } from "@/api/transport/browser-api-methods";
import { createTaxonomyCallers } from "./taxonomy-factory";

const browserTaxonomyCallers = createTaxonomyCallers(browserApiMethods);
export const listTaxonomyService = browserTaxonomyCallers.listTaxonomyService;
export const getTaxonomyDetailService =
  browserTaxonomyCallers.getTaxonomyDetailService;
export const createTaxonomyService =
  browserTaxonomyCallers.createTaxonomyService;
export const updateTaxonomyService =
  browserTaxonomyCallers.updateTaxonomyService;
export const deleteTaxonomyService =
  browserTaxonomyCallers.deleteTaxonomyService;
