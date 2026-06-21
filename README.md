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

## Using Pre-built Image (GitHub Container Registry)
The latest Docker image is automatically built and published to GHCR. You can run it directly without downloading the source code.

1. Create a `.env` file and fill in your environment variables.
2. Create an empty database file to avoid Docker creating a directory instead:
```bash
# Windows (PowerShell)
New-Item -Path .\database.db -ItemType File

# Linux/macOS
touch database.db
```
3. Run the bot using Docker:
```bash
docker run -d --name sega-arcade-update-bot --env-file .env -v ${PWD}/database.db:/app/database.db --restart unless-stopped ghcr.io/xingyantw/arcade-update-bot:main
```
*(Note: If you are using Linux/macOS, use `$(pwd)` instead of `${PWD}`)*

## Build from Source (Docker Compose)
1. Clone the repository, create a `.env` file, and create an empty `database.db` file as shown above.
2. Build and run with Docker Compose:
```bash
docker-compose up -d --build
```

# Todo
- [X] Command Usage Optimization
- [X] More Info Button
- [X] Bot Status
- [ ] More Commands
- [ ] Bot Homepage(?)
