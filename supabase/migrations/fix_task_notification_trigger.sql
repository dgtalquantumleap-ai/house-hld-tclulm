
-- Fix the task assignment notification trigger with correct column name
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to_user_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'userId', NEW.assigned_to_user_id,
        'title', 'New Task Assigned',
        'body', 'You have been assigned: ' || NEW.title,
        'data', jsonb_build_object('screen', 'tasks', 'taskId', NEW.id)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;

CREATE TRIGGER task_assigned_notification
  AFTER INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.assigned_to_user_id IS NOT NULL)
  EXECUTE FUNCTION notify_task_assigned();
