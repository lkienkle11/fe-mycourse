# Frontend Skill: Batch API Usage for Multi-Item Operations

## Purpose

When implementing frontend features that add, update, delete, assign, unassign, reorder, or otherwise modify multiple resources, the agent must use batch-capable APIs instead of calling the same single-item API repeatedly.

This rule applies to any frontend framework, language, or platform.

## Core Rule

Do not implement frontend logic that loops through selected items and sends one API request per item for a single user action.

Instead, the frontend must call one batch API endpoint with all affected items in the request body.

## Bad Pattern

Do not do this:

```ts
for (const roleId of selectedRoleIds) {
  await api.post(`/users/${userId}/roles/${roleId}`);
}
```

Do not do this:

```ts
await Promise.all(
  selectedIds.map((id) => api.delete(`/objects/${id}`))
);
```

Even if the calls are parallelized, this is still not the correct default for a multi-item user action.

## Required Pattern

Use one batch request:

```ts
await api.post(`/users/${userId}/roles/batch`, {
  roleIds: selectedRoleIds,
});
```

Or:

```ts
await api.delete(`/objects/batch`, {
  data: {
    ids: selectedIds,
  },
});
```

## Common Frontend Use Cases

Use batch API calls for features such as:

* Adding multiple roles to a user
* Removing multiple roles from a user
* Assigning multiple users to a role
* Removing multiple users from a role
* Creating multiple records
* Updating multiple records
* Deleting multiple records
* Bulk status changes
* Bulk publish or unpublish actions
* Bulk archive or restore actions
* Bulk permission changes
* Reordering many items
* Saving many selected items from a checkbox/table UI
* Any single user action that affects more than one resource

## UI Behavior Requirement

For a multi-item action, the frontend should treat the action as one operation.

Example:

```text
User selects 20 objects and clicks "Delete selected"
```

The frontend should send:

```text
One batch delete request
```

Not:

```text
20 separate delete requests
```

## API Client Requirement

The frontend API layer should expose batch functions directly.

Bad:

```ts
export async function deleteObject(id: string) {
  return api.delete(`/objects/${id}`);
}

for (const id of ids) {
  await deleteObject(id);
}
```

Better:

```ts
export async function deleteObjectsBatch(ids: string[]) {
  return api.delete(`/objects/batch`, {
    data: { ids },
  });
}
```

Another example:

```ts
export async function updateUserRolesBatch(userId: string, roleIds: string[]) {
  return api.post(`/users/${userId}/roles/batch`, {
    roleIds,
  });
}
```

## State Management Requirement

When a batch request succeeds, update frontend state once based on the batch response.

Avoid updating state item-by-item after many API calls.

Good:

```ts
const response = await deleteObjectsBatch(selectedIds);

setObjects((prev) =>
  prev.filter((item) => !selectedIds.includes(item.id))
);
```

For partial success:

```ts
const response = await deleteObjectsBatch(selectedIds);

const failedIds = response.results
  .filter((item) => item.status === "failed")
  .map((item) => item.id);

setObjects((prev) =>
  prev.filter((item) => !selectedIds.includes(item.id) || failedIds.includes(item.id))
);
```

## Loading State Requirement

Use one loading state for one batch operation.

Good:

```ts
const [isDeletingSelected, setIsDeletingSelected] = useState(false);

async function handleDeleteSelected() {
  setIsDeletingSelected(true);

  try {
    await deleteObjectsBatch(selectedIds);
  } finally {
    setIsDeletingSelected(false);
  }
}
```

Avoid creating one loading state per item unless the UI truly supports independent item-level actions.

## Error Handling Requirement

The frontend must handle both atomic failure and partial success responses.

### Atomic Failure

If the backend rejects the whole operation:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ROLE_ID",
    "message": "One or more role IDs are invalid."
  }
}
```

The frontend should show one clear error message.

Example:

```ts
showToast("Could not update roles. Please check your selection and try again.");
```

### Partial Success

If the backend supports partial success:

```json
{
  "success": true,
  "summary": {
    "total": 4,
    "succeeded": 3,
    "failed": 1
  },
  "results": [
    { "id": "1", "status": "success" },
    { "id": "2", "status": "success" },
    {
      "id": "3",
      "status": "failed",
      "error": {
        "code": "NOT_FOUND",
        "message": "Object not found."
      }
    },
    { "id": "4", "status": "success" }
  ]
}
```

The frontend should display a summary:

```text
3 items updated successfully. 1 item failed.
```

When useful, show item-level error details.

## Confirmation Dialog Requirement

For destructive batch actions, show a confirmation dialog that clearly states the number of affected items.

Example:

```text
Delete 12 selected objects?
This action cannot be undone.
```

Do not show one confirmation dialog per item.

## Validation Requirement

Before calling the batch API, validate:

* The selected item list is not empty.
* The selected item count does not exceed the batch limit.
* Duplicate IDs are removed when duplicates are not meaningful.
* Required fields are present.
* The user has confirmed destructive actions when needed.

Example:

```ts
const uniqueIds = Array.from(new Set(selectedIds));

if (uniqueIds.length === 0) {
  showToast("Please select at least one item.");
  return;
}

if (uniqueIds.length > 100) {
  showToast("You can select up to 100 items at a time.");
  return;
}

await deleteObjectsBatch(uniqueIds);
```

## Batch Size Awareness

The frontend should respect the backend maximum batch size.

If the backend allows a maximum of 100 items per request, the frontend should prevent or guide the user before submission.

Good UI behavior:

```text
You selected 125 items. Please select 100 or fewer items.
```

Do not silently split the request into many API calls unless the product and backend contract explicitly allow chunking.

## Chunking Rule

Chunking is not the default.

Do not automatically split one user action into many API calls unless:

1. The backend API contract explicitly supports chunked batch processing.
2. The product requirement accepts chunked partial progress.
3. The frontend clearly handles progress, cancellation, retry, and partial failure.
4. The user experience is designed around long-running or large-scale operations.

Default behavior:

```text
One user action affecting many resources = one batch API request.
```

## Optimistic UI Requirement

Use optimistic UI only when rollback behavior is clear.

For destructive or permission-sensitive batch operations, prefer waiting for the backend response before permanently changing UI state.

If optimistic update is used:

1. Store the previous state.
2. Apply the optimistic change once.
3. Roll back if the batch request fails.
4. Handle partial success carefully.

Example:

```ts
const previousObjects = objects;

setObjects((prev) =>
  prev.filter((item) => !selectedIds.includes(item.id))
);

try {
  await deleteObjectsBatch(selectedIds);
} catch (error) {
  setObjects(previousObjects);
  showToast("Delete failed. Changes were reverted.");
}
```

## Retry Requirement

Retry the whole batch operation only when it is safe and idempotent.

Do not retry item-by-item unless the backend contract explicitly supports item-level retry.

For critical operations, send an idempotency key when supported:

```ts
await api.post(
  `/objects/bulk-delete`,
  { ids: selectedIds },
  {
    headers: {
      "Idempotency-Key": crypto.randomUUID(),
    },
  }
);
```

## Accessibility Requirement

For batch actions, ensure the UI communicates:

* How many items are selected.
* What batch action will be performed.
* Whether the operation is loading.
* Whether the operation succeeded or failed.

Example:

```text
12 items selected
Deleting selected items...
12 items deleted successfully
```

## Testing Requirement

Frontend batch behavior must include tests for:

* No items selected
* Successful batch request
* Request payload contains all selected IDs
* Duplicate IDs are removed if required
* Batch size exceeded
* Atomic failure response
* Partial success response
* Loading state
* Confirmation dialog for destructive actions
* State update after success
* Rollback after failure when optimistic UI is used

## Final Instruction

Whenever a frontend feature performs one user action that affects multiple resources, the agent must use a batch API call.

The agent must not implement repeated single-item API calls in a loop as the default solution.

The correct default is:

```text
One user action affecting many resources = one frontend batch request.
```
