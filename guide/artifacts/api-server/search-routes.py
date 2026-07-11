import re

with open("dist/index.mjs", "r", encoding="utf-8") as f:
    content = f.read()

print("Contains '/auth/login':", "/auth/login" in content)
print("Contains 'auth/login':", "auth/login" in content)
print("Contains '/login':", "/login" in content)
print("Contains 'attendance-logs':", "attendance-logs" in content)
print("Contains 'usersTable':", "usersTable" in content)
print("Contains 'users':", "users" in content)

