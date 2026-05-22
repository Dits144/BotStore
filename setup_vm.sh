#!/bin/bash

# Configure Nginx for api.websitegue.my.id
cat << 'EOF' | sudo tee /etc/nginx/sites-available/api.websitegue.my.id
server {
    listen 80;
    server_name api.websitegue.my.id;

    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/api.websitegue.my.id /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Pull latest code and restart bot
cd /home/dits/BotStore
git pull origin wa-store-web-integration
pm2 restart "Bot Ditstore"
