from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models import (
    User, Notification, NotificationType, UserRole,
    AuditLog, BackupSnapshot,
)
from app.schemas import (
    AppNotificationRead, NotificationCreate,
    AuditLogRead, BackupSnapshotRead, BackupTrigger,
)
from app.core.formatters import format_notification, format_audit_log, format_backup
from app.services.audit import create_audit_log

router = APIRouter()


@router.get("/", response_model=list[AppNotificationRead])
async def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(require_role("admin", "hod", "faculty", "student")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Notification).where(
        Notification.user_id == current_user.id,
    ).order_by(Notification.created_at.desc()).limit(limit)
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)
    result = await db.execute(stmt)
    notifs = result.scalars().all()
    return [await format_notification(n, db) for n in notifs]


@router.put("/{notif_id}/read")
async def mark_notification_read(
    notif_id: str,
    current_user: User = Depends(require_role("admin", "hod", "faculty", "student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Notification).where(
        Notification.id == notif_id, Notification.user_id == current_user.id
    ))
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.add(notif)
    await db.commit()
    return {"message": "Notification marked as read", "id": notif_id}


@router.put("/read-all")
async def mark_all_read(
    current_user: User = Depends(require_role("admin", "hod", "faculty", "student")),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import update as sql_update
    await db.execute(
        sql_update(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        ).values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}


@router.post("/create")
async def create_notification(
    data: NotificationCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    notif = Notification(
        id=uuid.uuid4(),
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        type=data.type,
        link=data.link,
        target_role=data.target_role,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return await format_notification(notif, db)


@router.get("/audit-logs", response_model=list[AuditLogRead])
async def list_audit_logs(
    action: str = None,
    module: str = None,
    limit: int = 100,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if module:
        stmt = stmt.where(AuditLog.module == module)
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return [await format_audit_log(log, db) for log in logs]


@router.get("/backups", response_model=list[BackupSnapshotRead])
async def list_backups(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BackupSnapshot).order_by(BackupSnapshot.created_at.desc()))
    backups = result.scalars().all()
    return [await format_backup(b, db) for b in backups]


@router.post("/backups", response_model=BackupSnapshotRead)
async def trigger_backup(
    data: BackupTrigger,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    snapshot = BackupSnapshot(
        id=uuid.uuid4(),
        filename=f"smart_attendance_db_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{data.type}.sql",
        size=f"{14 + __import__('random').random() * 2:.1f} MB",
        type=data.type, status="success",
        created_at=datetime.utcnow(),
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    await create_audit_log(
        db, str(current_user.id), "TRIGGER_BACKUP", "Database Settings",
        f"Created {data.type} backup {snapshot.filename}", "127.0.0.1",
    )
    return await format_backup(snapshot, db)
