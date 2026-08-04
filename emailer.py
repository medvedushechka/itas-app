import os
import smtplib
from email.message import EmailMessage


def send_contact_email(
    *,
    to_email: str,
    subject: str,
    body_text: str,
    reply_to: str | None = None,
) -> None:
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "465"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    use_ssl = os.getenv("SMTP_USE_SSL", "1").strip() not in ("0", "false", "False", "")

    if not host or not user or not password:
        raise RuntimeError("SMTP не настроен: проверь SMTP_HOST/SMTP_USER/SMTP_PASSWORD в .env")

    msg = EmailMessage()
    msg["From"] = user
    msg["To"] = to_email
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to

    msg.set_content(body_text)

    if use_ssl:
        with smtplib.SMTP_SSL(host, port, timeout=20) as smtp:
            smtp.login(user, password)
            smtp.send_message(msg)
    else:
        with smtplib.SMTP(host, port, timeout=20) as smtp:
            smtp.starttls()
            smtp.login(user, password)
            smtp.send_message(msg)
