select * from weekly_hours;
select * from learning_resources;
select * from sync_queue;
select * from learning_entries;
select * from goals;
select * from daily_reports;


SELECT monday, tuesday, wednesday, thursday, friday, saturday, sunday FROM weekly_hours WHERE projectId = 2 ORDER BY weekStartDate DESC LIMIT 1