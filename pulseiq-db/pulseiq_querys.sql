select * from  git_metrics;
select * from commits_by_day;
select * from issues;
show tables;
select * from projects  ;
select * from goals; 
select * from tasks where status = 'completed';
select * from daily_reports;
select * from daily_hours;
select * from weekly_hours;

  SELECT monday, tuesday, wednesday, thursday, friday, saturday, sunday, weekStartDate
   FROM weekly_hours
   WHERE projectId = 13
   AND weekStartDate <= CURDATE()
   ORDER BY weekStartDate DESC
   LIMIT 1;
   
   
   SELECT monday, tuesday, wednesday, thursday, friday, saturday, sunday, weekStartDate
FROM weekly_hours
WHERE projectId = 2
AND weekStartDate = DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
LIMIT 1;

delete from daily_reports where id = 15;