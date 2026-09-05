"""In-App & Browser notification dispatcher."""
from typing import Dict, Any


class NotificationService:
    def __init__(self):
        pass

    def emit_in_app_notification(self, student_id: int, title: str, body: str, trigger: str) -> Dict[str, Any]:
        """Dispatch notification payload for consumption by frontend client."""
        return {
            "student_id": student_id,
            "title": title,
            "body": body,
            "trigger": trigger,
            "status": "queued"
        }


notification_service = NotificationService()
