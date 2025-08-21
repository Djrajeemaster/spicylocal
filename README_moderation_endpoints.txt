Moderation endpoints (server-side required)

1) GET /bagit/api/moderation_queue.php
   -> returns JSON:
      [{ id, deal_id, deal_title, deal_owner, reporter, reason, created_at }]

2) POST /bagit/api/moderation_action.php
   body: { id: string|number, action: 'ok'|'remove'|'ban'|'escalate' }
   -> returns JSON: { success: true } or { success:false, error:'...' }

Security notes:
- Require moderator/admin auth on both endpoints.
- Rate-limit actions and log actor/timestamp.
- Write to audit log (who, what, when).
