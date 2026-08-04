import pytest

from validators import clean_multiline, clean_single_line, normalize_email, parse_contact_payload


def test_clean_single_line_removes_headers_and_controls():
    assert clean_single_line(" Тема\r\nBcc: bad@example.com\x00 ", max_length=200) == "Тема Bcc: bad@example.com"


def test_clean_multiline_normalizes_newlines():
    assert clean_multiline("Первая\r\nВторая\rТретья", max_length=100) == "Первая\nВторая\nТретья"


def test_normalize_email_accepts_valid_address():
    assert normalize_email(" User@Example.COM ") == "User@example.com"


def test_normalize_email_rejects_invalid_address():
    with pytest.raises(ValueError, match="Некорректный email"):
        normalize_email("not-an-email")


def test_contact_requires_reply_identity():
    with pytest.raises(ValueError, match="Укажите имя или email"):
        parse_contact_payload({"message": "Достаточно длинное сообщение"})


def test_contact_honeypot_rejects_bot():
    with pytest.raises(ValueError, match="Не удалось отправить"):
        parse_contact_payload({
            "name": "Иван",
            "message": "Достаточно длинное сообщение",
            "company": "spam",
        })


def test_contact_payload_is_normalized():
    result = parse_contact_payload({
        "name": "  Иван   Иванов  ",
        "email": "ivan@example.com",
        "subject": " Вопрос\nпо вступлению ",
        "message": "  Добрый день!\r\nХочу вступить.  ",
        "company": "",
    })
    assert result.name == "Иван Иванов"
    assert result.subject == "Вопрос по вступлению"
    assert result.message == "Добрый день!\nХочу вступить."
