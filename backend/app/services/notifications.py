import os
import asyncio
from typing import Optional
from app.core.config import settings


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: Optional[str] = None,
) -> bool:
    """Send email via Resend API."""
    if not settings.RESEND_API_KEY:
        return False

    import httpx

    api_key = settings.RESEND_API_KEY
    sender = from_email or settings.EMAIL_FROM

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"from": sender, "to": to_email, "subject": subject, "html": html_content},
                timeout=10,
            )
            return resp.status_code == 200
    except Exception:
        return False


async def send_sms(
    to_phone: str,
    message: str,
) -> bool:
    """Send SMS via MSG91 API."""
    if not settings.SMS_API_KEY:
        return False

    import httpx

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.msg91.com/api/v5/flow/",
                headers={"authkey": settings.SMS_API_KEY},
                json={
                    "flow_id": "attendance_notifications",
                    "recipient": to_phone,
                    "var": message,
                },
                timeout=10,
            )
            return resp.status_code == 200
    except Exception:
        return False


async def send_notification_email(
    to_email: str,
    title: str,
    message: str,
):
    """Send a templated email notification."""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #313866; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">{title}</h2>
        </div>
        <div style="padding: 20px; background: #F3F4F9;">
            <p style="font-size: 16px; line-height: 1.6;">{message}</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">— Smart Attendance System</p>
        </div>
    </body>
    </html>
    """
    return await send_email(to_email, title, html)
