-- Phase 3 PR B: add nullable rejection_reason to automation_suggestions
--
-- Stores the user's stated reason when they reject an automation suggestion.
-- Purely informational — no application logic reads this column to change
-- rule confidence, rule status, matcher behavior, or suggestion generation.
--
-- Rollback: ALTER TABLE automation_suggestions DROP COLUMN rejection_reason;

ALTER TABLE automation_suggestions
  ADD COLUMN rejection_reason TEXT NULL;
