# Trivy Dashboard

Trivy tarafından taranmış container image'ların güvenlik açıklarını yönetmek için geliştirilmiş modern bir dashboard uygulaması.

## 🎯 Özellikler

### 1. Güvenlik Açığı Tekilleştirme (Deduplication)
- Aynı CVE'nin birden fazla sürümde tekrarlanmasını önler
- Sadece en son tarama sonuçlarını gösterir
- Benzersiz CVE sayısını doğru şekilde hesaplar

### 2. Tarama Durumu Göstergesi
- **Aktif (Yeşil)**: En son tarama
- **İnaktif (Turuncu)**: Eski tarama
- Tarama zamanını tooltip'te gösterir

### 3. Modern Kullanıcı Arayüzü
- Material-UI ile geliştirilmiş modern tasarım
- Canlı renkler ve smooth animasyonlar
- Responsive layout (masaüstü ve tablet uyumlu)
- Renk kodlu ciddiyet seviyeleri:
  - 🟣 **CRITICAL** (Kritik)
  - 🔴 **HIGH** (Yüksek)
  - 🟠 **MEDIUM** (Orta)
  - 🟢 **LOW** (Düşük)

### 4. Admin Kimlik Doğrulaması
- JWT tabanlı güvenli giriş sistemi
- Varsayılan admin hesabı: `trivy/trivy`
- Rol tabanlı erişim kontrolü
- Eski taramaları silme yetkisi

### 5. Güvenlik Açığı Çapraz Referansı
- CVE ID'ye göre arama yapabilme
- Etkilenen image'ları görüntüleme
- NVD (National Vulnerability Database) linklerine doğrudan erişim
- Sadece aktif taramaları gösterir

### 6. Redis Önbelleği
- Veritabanı ve backend arasında hızlı veri erişimi
- 5 dakikalık TTL (Time To Live)
- Otomatik cache geçersizleştirme
- Veri kalıcılığı etkinleştirilmiş

## 🏗️ Mimari

```
┌─────────────────────────────────────────┐
│         Frontend (React)                 │
│  - Material-UI Dashboard                │
│  - Kimlik Doğrulama & Yetkilendirme    │
│  - Gerçek Zamanlı Veri Görüntüleme     │
└────────────────┬────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────┐
│         Backend (FastAPI)               │
│  - Tekilleştirme Servisi               │
│  - Durum Servisi                       │
│  - Güvenlik Açığı İndeksi Servisi     │
│  - Kimlik Doğrulama Servisi           │
│  - Cache Servisi (Redis)              │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│ PostgreSQL   │  │ Redis Cache   │
│ Veritabanı   │  │ (5 dk TTL)    │
└──────────────┘  └───────────────┘
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Docker & Docker Compose
- Git

### Kurulum ve Çalıştırma

```bash
# Repository'yi klonlayın
git clone https://github.com/alperen-selcuk/trivy-dashboard-app.git
cd trivy-dashboard-app

# Servisleri başlatın
docker-compose up --build
```

### Erişim

- **Frontend**: http://localhost:8001
- **Backend API**: http://localhost:8002
- **API Dokümantasyonu**: http://localhost:8002/docs

### Giriş Bilgileri

- **Kullanıcı Adı**: `trivy`
- **Şifre**: `trivy`

## 📋 API Endpoints

### Tarama Sonuçları
```
GET    http://localhost:8002/api/scan-results                    # Tüm taramaları al
GET    http://localhost:8002/api/scan-results/deduplicated       # Tekilleştirilmiş taramaları al (cached)
POST   http://localhost:8002/api/scan-results                    # Yeni tarama ekle
DELETE http://localhost:8002/api/scan-results/{scan_id}          # Taramayı sil (admin)
```

### Image Taramaları
```
GET    http://localhost:8002/api/images/{image_name}/scans       # Image'ın tüm taramalarını al
```

### Güvenlik Açıkları
```
GET    http://localhost:8002/api/vulnerabilities                 # Tüm açıkları al
GET    http://localhost:8002/api/vulnerabilities?search=CVE-X    # Açık ara
GET    http://localhost:8002/api/vulnerabilities/{cve_id}/affected-images  # Etkilenen image'ları al
```

### Kimlik Doğrulama
```
POST   http://localhost:8002/api/auth/login                      # Giriş yap
GET    http://localhost:8002/api/auth/verify?token=TOKEN         # Token doğrula
```

## 🛠️ Teknoloji Stack

### Frontend
- **React 18.2** - UI framework
- **Material-UI 5.15** - Component library
- **React Router 6.20** - Routing
- **Axios 1.6** - HTTP client

### Backend
- **FastAPI 0.109** - Web framework
- **SQLAlchemy 2.0** - ORM
- **PostgreSQL 15** - Veritabanı
- **Redis 7** - Cache
- **Python-Jose 3.3** - JWT tokens
- **Passlib 1.7** - Şifre hashing

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Nginx** - Frontend server

## 📊 Proje Yapısı

```
trivy-dashboard-app/
├── backend/
│   ├── main.py                 # FastAPI uygulaması
│   ├── requirements.txt        # Python bağımlılıkları
│   └── Dockerfile             # Backend container
├── frontend/
│   ├── src/
│   │   ├── App.js             # Ana uygulama
│   │   ├── theme.js           # Material-UI teması
│   │   ├── pages/
│   │   │   └── LoginPage.js   # Giriş sayfası
│   │   ├── context/
│   │   │   └── AuthContext.js # Kimlik doğrulama state
│   │   └── components/        # React componentleri
│   ├── package.json           # Node bağımlılıkları
│   ├── Dockerfile             # Frontend container
│   └── nginx.conf             # Nginx konfigürasyonu
├── docker-compose.yml         # Servis orkestrasyonu
└── LICENSE                    # MIT Lisansı
```

## 🧪 Test Verisi Ekleme

```bash
curl -X POST http://localhost:8002/api/scan-results \
  -H "Content-Type: application/json" \
  -d '{
    "image_name": "myapp:v1.0",
    "scan_time": "2024-01-15T10:30:00",
    "vulnerabilities": [
      {
        "VulnerabilityID": "CVE-2024-1234",
        "Severity": "HIGH",
        "PkgName": "openssl",
        "InstalledVersion": "1.1.1",
        "FixedVersion": "1.1.2",
        "Description": "Buffer overflow açığı"
      }
    ]
  }'
```

## 🔐 Güvenlik

### Kimlik Doğrulama
- JWT tokens (24 saat geçerlilik)
- Bcrypt şifre hashing
- Rol tabanlı erişim kontrolü

### Veritabanı
- PostgreSQL şifreli bağlantılar
- SQL injection koruması (ORM)
- Pydantic ile input validasyonu

### API
- CORS etkinleştirilmiş
- Input validasyonu
- Hata yönetimi

## 📈 Performans

### Yanıt Süreleri (cache ile)
- İlk istek: 200-500ms
- Cached istek: 10-50ms
- Cache hit oranı: ~95%

## 🚢 Deployment

### Geliştirme
```bash
docker-compose up
```

Portlar:
- Frontend: http://localhost:8001
- Backend: http://localhost:8002
- PostgreSQL: localhost:5432 (internal)
- Redis: localhost:6379 (internal)

### Production
Ortam değişkenlerini ayarlayın:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-secret-key
```

## 📝 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.

## 👨‍💻 Geliştirici

**Hasan Alperen SELÇUK**

- LinkedIn: https://www.linkedin.com/in/hasanalperenselcuk/
- GitHub: https://github.com/alperen-selcuk

## 🤝 Katkıda Bulunma

Katkılarınız hoş karşılanır! Lütfen:

1. Repository'yi fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'e push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📞 Destek

Sorularınız veya sorunlarınız için:
- GitHub Issues açabilirsiniz
- LinkedIn üzerinden iletişime geçebilirsiniz

## 🎉 Teşekkürler

Bu proje Trivy güvenlik taraması sonuçlarını etkili bir şekilde yönetmek için geliştirilmiştir.

---

**Son Güncelleme**: Ocak 2024
