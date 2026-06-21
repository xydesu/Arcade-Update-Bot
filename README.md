# Arcade-Update-Bot

[Invite Bot](https://discord.com/oauth2/authorize?client_id=1241736420004204564)

# Related Project
[mai2dc](https://github.com/xydesu/mai2dc/tree/japanese)

# Build From Source Code
Install
```bash
npm install
```

Run

```bash
npm run start
```

# Docker Setup

1. Create a `.env` file and fill in your environment variables.
2. Create an empty database file to avoid Docker creating a directory instead:
```bash
# Windows (PowerShell)
New-Item -Path .\database.db -ItemType File

# Linux/macOS
touch database.db
```
3. Run with Docker Compose:
```bash
docker-compose up -d
```

# Todo
- [X] Command Usage Optimization
- [X] More Info Button
- [X] Bot Status
- [ ] More Commands
- [ ] Bot Homepage(?)
