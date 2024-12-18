git pull
npm run build
pm2 stop explorer
pm2 start "npm run start" --name explorer