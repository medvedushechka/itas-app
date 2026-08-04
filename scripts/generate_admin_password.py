from getpass import getpass

from werkzeug.security import generate_password_hash


password = getpass("Новый пароль администратора: ")
confirmation = getpass("Повторите пароль: ")
if password != confirmation:
    raise SystemExit("Пароли не совпадают")
if len(password) < 12:
    raise SystemExit("Пароль должен содержать не менее 12 символов")
print(generate_password_hash(password, method="pbkdf2:sha256:600000"))
