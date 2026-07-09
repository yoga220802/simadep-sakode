# Legacy Storage And Attachments Report

Generated: 2026-07-09

Backend reference inspected: `../backend-management-project/`.

## Upload And Delete Endpoints

All API paths are under `/v1` through `app/api/api.py`.

| Method/path | Source path | Function | Payload | Service method |
|---|---|---|---|---|
| `POST /tasks/{task_id}/attachment/upload-file` | `backend-management-project/app/api/routes/attachment_route.py` | `_Attachment.upload_task_attachment` | `UploadFile` | `AttachmentService.create_task_attachment` |
| `POST /tasks/{task_id}/attachment/upload-link` | `app/api/routes/attachment_route.py` | `_Attachment.upload_link_attachment` | `AttachmentLinkCreate` | `AttachmentService.create_link_task_attachment` |
| `POST /comments/{comment_id}/attachment/upload-link` | `app/api/routes/attachment_route.py` | `_Attachment.upload_comment_link_attachment` | `AttachmentLinkCreate` | `AttachmentService.create_link_comment_attachment` |
| `POST /comments/{comment_id}/attachment/upload-file` | `app/api/routes/attachment_route.py` | `_Attachment.upload_comment_attachment` | `UploadFile` | `AttachmentService.create_comment_attachment` |
| `DELETE /attachment/{attachment_id}` | `app/api/routes/attachment_route.py` | `_Attachment.delete_attachment` | path param | `AttachmentService.delete_attachment` |

## File Validation

| Rule | Source path | Symbol | Behavior |
|---|---|---|---|
| Supported MIME types | `backend-management-project/app/services/attachment_service.py` | `ALLOWED_EXTENSIONS` | `image/png`, `image/jpeg`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`. |
| Size limit | `app/services/attachment_service.py` | `MAX_SIZE = 5 * 1024 * 1024` | Files larger than 5 MiB are rejected. |
| Link attachments | `app/services/attachment_service.py` | `create_link_task_attachment`, `create_link_comment_attachment` | Stores `file_name` as link name, `file_path` as URL, `file_size="0"`, `mime_type="hyperlink"`. |

## Storage Provider And Naming

| Item | Legacy behavior |
|---|---|
| Provider | Cloudinary through `backend-management-project/app/utils/cloudinary.py`. |
| Initialization | `init_cloudinary` reads `settings.CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. |
| Upload | `upload_bytes` calls `cloudinary.uploader.upload` with `resource_type="auto"`. |
| Delete | `destroy_by_url` extracts public id from URL and calls `cloudinary.uploader.destroy(..., resource_type="auto")`. |
| File naming | Source stores original `file.filename` as `Attachment.file_name`. Cloudinary public id naming is delegated to Cloudinary helper; no deterministic project/task key found. |
| URL behavior | Stored `file_path` appears to be Cloudinary secure URL or supplied external link. No private URL/signing behavior found. |

## Authorization

| Operation | Source path/symbol | Authorization behavior |
|---|---|---|
| Task file/link attachment create | `AttachmentService.create_task_attachment`; `create_link_task_attachment` | Non-admin users must be members of the task's project. Admin bypass allowed. |
| Comment file/link attachment create | `AttachmentService.create_comment_attachment`; `create_link_comment_attachment` | Comment must exist and `comment.user_id == user.id`. No admin bypass found. |
| Attachment delete | `AttachmentService.delete_attachment` | Admin can delete any. Non-admin must be owner of the task's project. |

## Transaction And Consistency

| Flow | Source behavior | Risk |
|---|---|---|
| Direct file upload route | Calls Cloudinary upload before DB attachment creation. If upload fails, catches all exceptions and creates a DB row with `file_path="Error Uploading"` and empty size. | Orphaned provider files are possible if DB insert/commit fails after upload; failed upload rows look like attachments. |
| Link attachment route | Creates DB metadata only. | URL validation/security not evident from source. |
| Comment attachment route | Same direct upload pattern as task file attachment. | Same consistency risk; author-only policy may be stricter than target wants. |
| Delete route | Adds `AttachmentDeleteRequestedEvent`, then deletes DB metadata and commits. Handler deletes provider object after commit/background. | Provider delete can fail after metadata is gone; no durable retry found. |
| Event upload path | `upload_attachment_with_event` creates placeholder and emits `AttachmentUploadRequestedEvent`, but route code uses direct upload path. | Dead/unused alternate behavior complicates migration assumptions. |

## Orphan Cleanup And External Calls

- No scheduled orphan cleanup job found.
- No durable retry table/outbox found.
- Cloudinary calls are external network side effects; this audit did not execute them.
- Attachment delete cleanup is best-effort background work after commit.

## Target Storage Port Mapping

| Legacy concept | Target design |
|---|---|
| `upload_bytes` Cloudinary helper | `StoragePort.putObject` adapter with provider-specific implementation. |
| `destroy_by_url` | `StoragePort.deleteObject` with stable storage key, not parsed public URL. |
| `Attachment.file_path` | Split into `storage_key`, `public_url` or `download_url`, and `external_url` for link attachments. |
| `mime_type="hyperlink"` | Target `attachment_kind = "link"` plus nullable MIME type. |
| direct upload before DB insert | Create metadata/upload intent transaction, then process storage through retryable outbox/job. |
| background delete event | Outbox event with idempotent storage delete and retry state. |
| comment-author-only attachment | Owner decision: preserve strict author-only behavior or align with comment/task edit policy. |

