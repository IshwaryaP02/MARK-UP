from datetime import datetime, date, time


def _fmt_datetime(dt: datetime | None) -> str | None:
    if not dt:
        return None
    return dt.strftime("%Y-%m-%d %I:%M %p")


def _fmt_date(d: date | None) -> str | None:
    if not d:
        return None
    return d.isoformat()


def _fmt_time(t) -> str:
    if isinstance(t, str):
        return t
    if hasattr(t, "strftime"):
        return t.strftime("%I:%M %p").lstrip("0")
    return str(t)


def _fmt_pct(value) -> float:
    if value is None:
        return 0.0
    return round(float(value), 1)


def _time_from_str(ts: str) -> time:
    for fmt in ("%I:%M %p", "%H:%M"):
        try:
            return datetime.strptime(ts.strip(), fmt).time()
        except ValueError:
            continue
    raise ValueError(f"Cannot parse time: {ts}")
