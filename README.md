# Trivy Vulnerability Dashboard 🛡️

Trivy Vulnerability Dashboard, Docker imajlarınızın güvenlik taramalarını görselleştiren ve yöneten modern bir web uygulamasıdır. Bu dashboard sayesinde Trivy tarama sonuçlarınızı kolayca görüntüleyebilir, filtreleyebilir ve analiz edebilirsiniz.

![Dashboard Screenshot](docs/dashboard-screenshot.png)

## 🌟 Özellikler

- 📊 Gerçek zamanlı vulnerability görüntüleme
- 🔍 Severity (CRITICAL, HIGH, MEDIUM, LOW) bazlı filtreleme
- 📝 Detaylı vulnerability raporları
- 🔄 Otomatik yenileme (30 saniye)
- 📱 Responsive tasarım
- 🐳 Tam Docker desteği
- 💾 PostgreSQL ile kalıcı veri depolama

## 🚀 Başlangıç

### Ön Gereksinimler

- Docker ve Docker Compose
- Trivy CLI
- Node.js 18+ (geliştirme için)
- Python 3.11+ (geliştirme için)

### Kurulum

1. Repo'yu klonlayın:
```bash
git clone https://github.com/yourusername/trivy-dashboard.git
cd trivy-dashboard
```

2. Uygulamayı başlatın:
```bash
docker-compose up -d
```

3. Tarayıcınızda açın:
```
http://localhost
```

### 🔍 Image Tarama

Bir Docker imajını taramak için:

```bash
trivy image -f json $IMAGE_NAME | jq -c --arg img "$IMAGE_NAME" --arg time "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" '{image_name: $img, scan_time: $time, vulnerabilities: [.Results[] | select(.Vulnerabilities != null) | .Vulnerabilities[]] | unique}' | curl -X POST -H "Content-Type: application/json" -d @- http://localhost/api/scan-results
```

## 🏗️ Proje Yapısı

```
trivy-dashboard/
├── backend/                 # FastAPI backend
│   ├── main.py             # Ana uygulama
│   ├── requirements.txt    # Python bağımlılıkları
│   └── Dockerfile         
├── frontend/               # React frontend
│   ├── src/               
│   ├── public/            
│   ├── package.json       
│   └── Dockerfile        
└── docker-compose.yml      # Docker compose yapılandırması
```

## 🛠️ Teknolojiler

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- Uvicorn

### Frontend
- React
- Material-UI
- Axios
- React Data Grid

### Deployment
- Docker
- Nginx
- Docker Compose

## 📝 API Endpoints

- `POST /api/scan-results`: Yeni tarama sonucu ekler
- `GET /api/scan-results`: Tüm tarama sonuçlarını listeler

## 🔒 Güvenlik

- CORS koruması
- Rate limiting
- Maksimum istek boyutu sınırlaması (50MB)
- SQL injection koruması

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 Yazarlar

- [Hasan Alperen SELCUK](https://github.com/alperen-selcuk)

## 🙏 Teşekkürler

- [Trivy](https://github.com/aquasecurity/trivy) - Container güvenlik tarayıcısı
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - Frontend framework
- [Material-UI](https://mui.com/) - UI component library
