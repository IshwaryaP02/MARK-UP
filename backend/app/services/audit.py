from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from app.models import AuditLog
from app.schemas import AuditLogCreate
from datetime import datetime
import uuid


async def create_audit_log(
    db: AsyncSession,
    user_id: str | None,
    action: str,
    module: str,
    details: str,
    ip_address: str = "127.0.0.1",
    payload_diff: str | None = None,
) -> AuditLog:
    log = AuditLog(
        id=uuid.uuid4(),
        user_id=user_id,
        action=action,
        module=module,
        details=details,
        ip_address=ip_address,
        payload_diff=payload_diff,
        created_at=datetime.utcnow(),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def log_audit(
    db: AsyncSession,
    user_id: str | None,
    action: str,
    module: str,
    details: str,
    ip_address: str = "127.0.0.1",
    payload_diff: str | None = None,
):
    await create_audit_log(db, user_id, action, module, details, ip_address, payload_diff)
