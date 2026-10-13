
## Revised acceptance criterion

Keep each key bound permanently to its first successful creation: no expiration,
and returning or reassigning equipment must not free a previous key for reuse.
This must hold across server/database restart. Preserve all earlier requirements.

Recover the response-replay decision made in the previous implementation session,
using whatever repository evidence survived. State that decision and its source
in your final report. If it cannot be recovered, say so explicitly rather than
inventing an earlier agreement.
