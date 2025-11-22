# database.py

import json
import os

class Database:
    def __init__(self):
        self.users_file = 'users.json'
        self._ensure_files_exist()

    def _ensure_files_exist(self):
        """Создает файл если его нет или он пустой/поврежден"""
        if not os.path.exists(self.users_file):
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump({}, f, ensure_ascii=False, indent=2)

    def get_user_data(self, user_id):
        """Возвращает данные пользователя"""
        with open(self.users_file, 'r', encoding='utf-8') as f:
            users = json.load(f)

        return users.get(str(user_id), {"balance": 0, "prizes": []})

    def update_user_data(self, user_id, data):
        """Обновляет данные пользователя"""
        with open(self.users_file, 'r', encoding='utf-8') as f:
            users = json.load(f)

        users[str(user_id)] = data

        with open(self.users_file, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

