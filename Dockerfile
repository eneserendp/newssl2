# Node sürümünü değiştir
FROM node:18-alpine

# Timezone ayarları
RUN apk add --no-cache tzdata
ENV TZ=Europe/Istanbul

WORKDIR /app

# Dependencies için package dosyalarını kopyala
COPY package*.json ./
COPY prisma ./prisma/

# Dev dependencies dahil tüm bağımlılıkları yükle
RUN npm install

# Prisma client'ı oluştur
RUN npx prisma generate

# Uygulama dosyalarını kopyala
COPY . .

# Production build
RUN npm run build

# Port ayarı
EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "start"]