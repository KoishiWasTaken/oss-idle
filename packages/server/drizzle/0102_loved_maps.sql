-- Loved sets: live like ranked, no pp. By hand like 0038+.
ALTER TABLE `beatmapset` MODIFY `status` enum('pending','ranked','rejected','unranked','loved') NOT NULL DEFAULT 'pending';
