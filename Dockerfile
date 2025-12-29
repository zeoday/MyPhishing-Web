# 构建阶段：编译前端代码
FROM node:18-alpine AS build
WORKDIR /app

# 复制前端依赖文件
COPY package.json package-lock.json ./
# 国内源加速（可选）
RUN npm install --registry=https://registry.npmmirror.com

# 复制前端源码并构建
COPY . .
RUN npm run build

# 运行阶段：替换为 nginx:alpine（轻量运行时，核心优化点）
FROM nginx:alpine

# 删除默认配置，创建SPA路由配置
RUN rm /etc/nginx/conf.d/default.conf && \
    echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

# 从构建阶段复制 dist 文件夹到 Nginx 静态资源目录
COPY --from=build /app/dist /usr/share/nginx/html

# 暴露 Nginx 默认端口（80）
EXPOSE 80