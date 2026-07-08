-- Lower the minimum allowed reading pace from 60 to 30 WPM.
ALTER TABLE passages DROP CONSTRAINT ck_passages_wpm;
ALTER TABLE passages ADD CONSTRAINT ck_passages_wpm CHECK (wpm BETWEEN 30 AND 1500);
