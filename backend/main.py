from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import traceback
import logging
import sys
from collections import defaultdict
from passlib.context import CryptContext
from jose import JWTError, jwt

# Setup logging
logging.basicConfig(
    stream=sys.stderr,
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"Global Exception: {str(exc)}\n{traceback.format_exc()}"
    logger.error(error_msg)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "traceback": error_msg}
    )

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Veritabanı bağlantısı
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://trivy_user:trivy_password@db:5432/trivy_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLAlchemy modeli
Base = declarative_base()

class ScanResultDB(Base):
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    image_name = Column(String)
    scan_time = Column(DateTime)
    vulnerabilities = Column(JSON)
    is_latest = Column(Integer, default=0)  # 0 = not latest, 1 = latest for this version


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="user")  # "admin" or "user"
    created_at = Column(DateTime, default=datetime.now)




# Veritabanı tablosunu oluştur
Base.metadata.create_all(bind=engine)

class ScanResult(BaseModel):
    image_name: str
    scan_time: datetime
    vulnerabilities: List[Dict[Any, Any]]
    
    class Config:
        max_anystr_length = 1024 * 1024 * 50
        arbitrary_types_allowed = True

# Deduplication Service
class DeduplicationService:
    """Service for deduplicating vulnerabilities across scans"""
    
    @staticmethod
    def get_latest_scans_by_version(scans: List[ScanResultDB]) -> Dict[str, ScanResultDB]:
        """
        Group scans by image version and return only the latest scan for each version.
        
        Args:
            scans: List of all scan results
            
        Returns:
            Dictionary mapping version to latest scan
        """
        latest_by_version = {}
        
        for scan in scans:
            # Extract base image name and version
            parts = scan.image_name.split(':')
            version = parts[1] if len(parts) > 1 else 'latest'
            
            # Keep only the latest scan for this version
            if version not in latest_by_version:
                latest_by_version[version] = scan
            else:
                existing_scan = latest_by_version[version]
                if scan.scan_time > existing_scan.scan_time:
                    latest_by_version[version] = scan
        
        return latest_by_version
    
    @staticmethod
    def deduplicate_vulnerabilities(vulnerabilities: List[Dict[Any, Any]]) -> List[Dict[Any, Any]]:
        """
        Remove duplicate vulnerabilities based on VulnerabilityID (CVE code).
        
        Args:
            vulnerabilities: List of vulnerability dictionaries
            
        Returns:
            List of unique vulnerabilities
        """
        seen_cves = {}
        unique_vulns = []
        
        for vuln in vulnerabilities:
            cve_id = vuln.get('VulnerabilityID', '')
            
            # If we haven't seen this CVE before, add it
            if cve_id not in seen_cves:
                seen_cves[cve_id] = True
                unique_vulns.append(vuln)
        
        return unique_vulns
    
    @staticmethod
    def get_unique_vulnerabilities_across_versions(scans: List[ScanResultDB]) -> List[Dict[Any, Any]]:
        """
        Get unique vulnerabilities across all versions (latest scans only).
        
        Args:
            scans: List of all scan results
            
        Returns:
            List of unique vulnerabilities across all versions
        """
        all_vulns = []
        
        for scan in scans:
            if scan.vulnerabilities:
                all_vulns.extend(scan.vulnerabilities)
        
        # Deduplicate by CVE ID
        return DeduplicationService.deduplicate_vulnerabilities(all_vulns)
    
    @staticmethod
    def get_deduplicated_results(scans: List[ScanResultDB]) -> List[Dict[str, Any]]:
        """
        Get deduplicated scan results grouped by image name.
        
        Args:
            scans: List of all scan results
            
        Returns:
            List of deduplicated results grouped by image
        """
        # Group by base image name
        by_image = defaultdict(list)
        for scan in scans:
            if not scan.image_name:
                continue
            base_name = scan.image_name.split(':')[0]
            by_image[base_name].append(scan)
        
        results = []
        for image_name, image_scans in by_image.items():
            # Get latest scans for each version
            latest_by_version = DeduplicationService.get_latest_scans_by_version(image_scans)
            
            # Find the SINGLE latest scan across ALL versions
            if not latest_by_version:
                continue
                
            overall_latest_scan = max(
                latest_by_version.values(),
                key=lambda s: s.scan_time
            )
            
            # For the main view, we only show vulnerabilities from the LATEST scan
            # This satisfies the user requirement "en son taramayı baz alarak sayısını göstersin"
            main_vulnerabilities = overall_latest_scan.vulnerabilities or []
            unique_main_vulns = DeduplicationService.deduplicate_vulnerabilities(main_vulnerabilities)
            
            # Mark simple active/inactive status for versions
            # Active = The scan matches the overall_latest_scan (or we could define active as 'latest of its version')
            # User requirement: "eğer en yeni tarama varsa eskilerini turuncu inactive en son taramayı active olarak göstersin"
            # This usually means comparing within a version history, OR comparing across versions?
            # Let's persist the 'latest_by_version' logic for the sub-list (so each version has one entry),
            # but we can flag which one is the "Head" (Overall Latest).
            
            latest_scan_time = overall_latest_scan.scan_time
            
            results.append({
                'image_name': image_name,
                'scan_time': latest_scan_time,
                'current_version': overall_latest_scan.image_name.split(':')[1] if ':' in overall_latest_scan.image_name else 'latest',
                'tags': [
                    {
                        'tag': scan.image_name.split(':')[1] if ':' in scan.image_name else 'latest',
                        'scan_time': scan.scan_time.isoformat(),
                        'vulnerabilities': scan.vulnerabilities or [],
                        'total_vulns': len(scan.vulnerabilities or []),
                        'is_latest_global': (scan.id == overall_latest_scan.id)
                    }
                    for scan in latest_by_version.values()
                ],
                'vulnerabilities': unique_main_vulns,
                'total_vulns': len(unique_main_vulns)
            })
        
        return results


# Status Service
class StatusService:
    """Service for determining and managing scan status (active/inactive)"""
    
    @staticmethod
    def get_scan_status(scan: ScanResultDB, all_scans: List[ScanResultDB]) -> str:
        """
        Determine if a scan is active (latest) or inactive (older) for its version.
        
        Args:
            scan: The scan to check
            all_scans: All scans to compare against
            
        Returns:
            'active' if this is the latest scan for its version, 'inactive' otherwise
        """
        # Extract version from image name
        parts = scan.image_name.split(':')
        version = parts[1] if len(parts) > 1 else 'latest'
        
        # Find all scans for this version
        same_version_scans = []
        for s in all_scans:
            s_parts = s.image_name.split(':')
            s_version = s_parts[1] if len(s_parts) > 1 else 'latest'
            if s_version == version:
                same_version_scans.append(s)
        
        # Find the latest scan for this version
        if same_version_scans:
            latest_scan = max(same_version_scans, key=lambda s: s.scan_time)
            return 'active' if scan.id == latest_scan.id else 'inactive'
        
        return 'unknown'
    
    @staticmethod
    def mark_latest_scans(scans: List[ScanResultDB]) -> Dict[int, str]:
        """
        Mark which scans are latest for their versions.
        
        Args:
            scans: List of all scans
            
        Returns:
            Dictionary mapping scan ID to status
        """
        status_map = {}
        
        # Group by version
        by_version = defaultdict(list)
        for scan in scans:
            parts = scan.image_name.split(':')
            version = parts[1] if len(parts) > 1 else 'latest'
            by_version[version].append(scan)
        
        # Mark latest for each version
        for version, version_scans in by_version.items():
            latest_scan = max(version_scans, key=lambda s: s.scan_time)
            for scan in version_scans:
                status_map[scan.id] = 'active' if scan.id == latest_scan.id else 'inactive'
        
        return status_map
    
    @staticmethod
    def get_scans_with_status(scans: List[ScanResultDB]) -> List[Dict[str, Any]]:
        """
        Get scans with their status information.
        
        Args:
            scans: List of scans
            
        Returns:
            List of scans with status field
        """
        status_map = StatusService.mark_latest_scans(scans)
        
        results = []
        for scan in scans:
            results.append({
                'id': scan.id,
                'image_name': scan.image_name,
                'scan_time': scan.scan_time,
                'status': status_map.get(scan.id, 'unknown'),
                'vulnerabilities': scan.vulnerabilities or [],
                'vulnerability_count': len(scan.vulnerabilities or [])
            })
        
        return results

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/scan-results")
async def add_scan_result(scan_result: ScanResult):
    db = SessionLocal()
    try:
        db_scan_result = ScanResultDB(
            image_name=scan_result.image_name,
            scan_time=scan_result.scan_time,
            vulnerabilities=json.loads(json.dumps(scan_result.vulnerabilities))
        )
        db.add(db_scan_result)
        db.commit()
        return {"message": "Scan result added successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/api/scan-results")
async def get_scan_results():
    db = SessionLocal()
    try:
        results = db.query(ScanResultDB).order_by(ScanResultDB.scan_time.desc()).all()
        return [
            {
                "image_name": result.image_name,
                "scan_time": result.scan_time,
                "vulnerabilities": result.vulnerabilities
            }
            for result in results
        ]
    finally:
        db.close()

@app.get("/api/scan-results/deduplicated")
async def get_deduplicated_scan_results():
    """
    Get scan results with deduplication applied.
    Returns only the latest scan for each image version,
    with vulnerabilities deduplicated by CVE code.
    """
    db = SessionLocal()
    try:
        results = db.query(ScanResultDB).order_by(ScanResultDB.scan_time.desc()).all()
        deduplicated = DeduplicationService.get_deduplicated_results(results)
        return deduplicated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/api/images/{image_name}/scans")
async def get_image_scans_with_status(image_name: str):
    """
    Get all scans for a specific image with status information.
    Returns scans sorted by scan_time (newest first).
    Each scan includes active/inactive status.
    """
    db = SessionLocal()
    try:
        # Get all scans for this image
        scans = db.query(ScanResultDB).filter(
            ScanResultDB.image_name.like(f"{image_name}:%")
        ).order_by(ScanResultDB.scan_time.desc()).all()
        
        if not scans:
            return []
        
        # Get scans with status
        scans_with_status = StatusService.get_scans_with_status(scans)
        
        return scans_with_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# Redis Cache Service
import redis
import os

class CacheService:
    """Service for caching data in Redis"""
    
    _redis_client = None
    
    @classmethod
    def get_client(cls):
        """Get or create Redis client"""
        if cls._redis_client is None:
            try:
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
                cls._redis_client = redis.from_url(redis_url, decode_responses=True)
                # Test connection
                cls._redis_client.ping()
                print("✓ Redis connected successfully")
            except Exception as e:
                print(f"⚠ Redis connection failed: {e}. Continuing without cache.")
                cls._redis_client = None
        return cls._redis_client
    
    @classmethod
    def get(cls, key: str):
        """Get value from cache"""
        try:
            client = cls.get_client()
            if client:
                value = client.get(key)
                if value:
                    return json.loads(value)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None
    
    @classmethod
    def set(cls, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL"""
        try:
            client = cls.get_client()
            if client:
                client.setex(key, ttl, json.dumps(value, default=str))
        except Exception as e:
            print(f"Cache set error: {e}")
    
    @classmethod
    def delete(cls, key: str):
        """Delete value from cache"""
        try:
            client = cls.get_client()
            if client:
                client.delete(key)
        except Exception as e:
            print(f"Cache delete error: {e}")
    
    @classmethod
    def invalidate_pattern(cls, pattern: str):
        """Invalidate all keys matching pattern"""
        try:
            client = cls.get_client()
            if client:
                keys = client.keys(pattern)
                if keys:
                    client.delete(*keys)
        except Exception as e:
            print(f"Cache invalidate error: {e}")

# Update endpoints to use cache
@app.get("/api/scan-results/deduplicated")
@app.get("/api/scan-results/deduplicated")
async def get_deduplicated_scan_results():
    """
    Get scan results with deduplication applied.
    Returns only the latest scan for each image version,
    with vulnerabilities deduplicated by CVE code.
    """
    print("DEBUG: get_deduplicated_scan_results called")
    try:
        # Cache disabled for debugging
        # cached = CacheService.get("scan_results:deduplicated")
        # if cached:
        #     return cached
        
        db = SessionLocal()
        try:
            results = db.query(ScanResultDB).order_by(ScanResultDB.scan_time.desc()).all()
            deduplicated = DeduplicationService.get_deduplicated_results(results)
            
            # Cache disabled for debugging
            # CacheService.set("scan_results:deduplicated", deduplicated, ttl=300)
            
            return deduplicated
        finally:
            db.close()
            
    except Exception as e:
        tb_str = traceback.format_exc()
        print(f"ERROR in endpoint: {tb_str}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}\nTraceback: {tb_str}")

# Update POST endpoint to invalidate cache
@app.post("/api/scan-results")
async def add_scan_result(scan_result: ScanResult):
    db = SessionLocal()
    try:
        db_scan_result = ScanResultDB(
            image_name=scan_result.image_name,
            scan_time=scan_result.scan_time,
            vulnerabilities=json.loads(json.dumps(scan_result.vulnerabilities))
        )
        db.add(db_scan_result)
        db.commit()
        
        # Invalidate cache
        CacheService.invalidate_pattern("scan_results:*")
        
        return {"message": "Scan result added successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/api/cache/health")
async def cache_health():
    """Check Redis cache health"""
    try:
        client = CacheService.get_client()
        if client:
            client.ping()
            return {"status": "healthy", "redis": "connected"}
        else:
            return {"status": "degraded", "redis": "not connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# Auth Configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours


class AuthService:
    """Authentication service"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now() + expires_delta
        else:
            expire = datetime.now() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                return None
            return username
        except JWTError:
            return None
    
    @staticmethod
    def create_admin_account(db):
        """Create default admin account if it doesn't exist"""
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if not existing_admin:
            admin_user = User(
                username="admin",
                password_hash=AuthService.hash_password("admin12345"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("✓ Admin account created: admin/admin12345")
            return admin_user
        return existing_admin


# Pydantic models for auth
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


# Initialize admin account on startup
@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    try:
        AuthService.create_admin_account(db)
    finally:
        db.close()


# Auth endpoints
@app.post("/api/auth/login")
async def login(credentials: LoginRequest):
    """Login endpoint"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == credentials.username).first()
        
        if not user or not AuthService.verify_password(credentials.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access_token = AuthService.create_access_token(
            data={"sub": user.username},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        }
    finally:
        db.close()


@app.get("/api/auth/verify")
async def verify_token(token: str = None):
    """Verify token endpoint"""
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    
    username = AuthService.verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    finally:
        db.close()


@app.delete("/api/scan-results/{scan_id}")
async def delete_scan_result(scan_id: int, token: str = None):
    """Delete scan result (admin only)"""
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    
    username = AuthService.verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user or user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        scan = db.query(ScanResultDB).filter(ScanResultDB.id == scan_id).first()
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        db.delete(scan)
        db.commit()
        
        # Invalidate cache
        CacheService.invalidate_pattern("scan_results:*")
        
        return {"message": "Scan deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# Vulnerability Index Service
class VulnerabilityIndexService:
    """Service for indexing and searching vulnerabilities across scans"""
    
    @staticmethod
    def build_vulnerability_index(scans: List[ScanResultDB]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Build an index of vulnerabilities mapped to affected images.
        Only includes vulnerabilities from active (latest) scans.
        
        Args:
            scans: List of all scan results
            
        Returns:
            Dictionary mapping CVE ID to list of affected images
        """
        # Get latest scans by version
        latest_by_version = DeduplicationService.get_latest_scans_by_version(scans)
        
        # Build vulnerability index
        vuln_index = defaultdict(list)
        
        for scan in latest_by_version.values():
            if scan.vulnerabilities:
                for vuln in scan.vulnerabilities:
                    cve_id = vuln.get('VulnerabilityID', '')
                    if cve_id:
                        vuln_index[cve_id].append({
                            'image_name': scan.image_name,
                            'scan_time': scan.scan_time.isoformat(),
                            'severity': vuln.get('Severity', 'UNKNOWN'),
                            'package': vuln.get('PkgName', ''),
                            'installed_version': vuln.get('InstalledVersion', ''),
                            'fixed_version': vuln.get('FixedVersion', ''),
                            'description': vuln.get('Description', '')
                        })
        
        return dict(vuln_index)
    
    @staticmethod
    def get_affected_images(cve_id: str, scans: List[ScanResultDB]) -> List[Dict[str, Any]]:
        """
        Get all images affected by a specific CVE (from active scans only).
        
        Args:
            cve_id: The CVE ID to search for
            scans: List of all scan results
            
        Returns:
            List of affected images
        """
        # Get latest scans by version
        latest_by_version = DeduplicationService.get_latest_scans_by_version(scans)
        
        affected = []
        for scan in latest_by_version.values():
            if scan.vulnerabilities:
                for vuln in scan.vulnerabilities:
                    if vuln.get('VulnerabilityID') == cve_id:
                        affected.append({
                            'image_name': scan.image_name,
                            'version': scan.image_name.split(':')[1] if ':' in scan.image_name else 'latest',
                            'scan_time': scan.scan_time.isoformat(),
                            'severity': vuln.get('Severity', 'UNKNOWN'),
                            'package': vuln.get('PkgName', ''),
                            'installed_version': vuln.get('InstalledVersion', ''),
                            'fixed_version': vuln.get('FixedVersion', ''),
                            'description': vuln.get('Description', '')
                        })
                        break  # Only add once per image
        
        return affected
    
    @staticmethod
    def search_vulnerabilities(query: str, scans: List[ScanResultDB]) -> List[Dict[str, Any]]:
        """
        Search vulnerabilities by CVE ID or description (from active scans only).
        
        Args:
            query: Search query
            scans: List of all scan results
            
        Returns:
            List of matching vulnerabilities
        """
        # Get latest scans by version
        latest_by_version = DeduplicationService.get_latest_scans_by_version(scans)
        
        # Collect all unique vulnerabilities from active scans
        seen_cves = {}
        results = []
        
        for scan in latest_by_version.values():
            if scan.vulnerabilities:
                for vuln in scan.vulnerabilities:
                    cve_id = vuln.get('VulnerabilityID', '')
                    
                    # Skip if we've already seen this CVE
                    if cve_id in seen_cves:
                        continue
                    
                    # Check if query matches CVE ID or description
                    query_lower = query.lower()
                    if (cve_id.lower().find(query_lower) >= 0 or 
                        vuln.get('Description', '').lower().find(query_lower) >= 0):
                        
                        seen_cves[cve_id] = True
                        results.append({
                            'VulnerabilityID': cve_id,
                            'Severity': vuln.get('Severity', 'UNKNOWN'),
                            'Description': vuln.get('Description', ''),
                            'AffectedImageCount': len(VulnerabilityIndexService.get_affected_images(cve_id, scans))
                        })
        
        return results


# Vulnerability endpoints
@app.get("/api/vulnerabilities")
async def get_vulnerabilities(search: str = ""):
    """
    Get all vulnerabilities from active scans.
    Optionally filter by search query (CVE ID or description).
    """
    # Try to get from cache
    cache_key = f"vulnerabilities:{search}" if search else "vulnerabilities:all"
    cached = CacheService.get(cache_key)
    if cached:
        return cached
    
    db = SessionLocal()
    try:
        scans = db.query(ScanResultDB).order_by(ScanResultDB.scan_time.desc()).all()
        
        if search:
            results = VulnerabilityIndexService.search_vulnerabilities(search, scans)
        else:
            # Get all unique vulnerabilities from active scans
            latest_by_version = DeduplicationService.get_latest_scans_by_version(scans)
            all_vulns = []
            seen_cves = {}
            
            for scan in latest_by_version.values():
                if scan.vulnerabilities:
                    for vuln in scan.vulnerabilities:
                        cve_id = vuln.get('VulnerabilityID', '')
                        if cve_id not in seen_cves:
                            seen_cves[cve_id] = True
                            all_vulns.append(vuln)
            
            results = [
                {
                    'VulnerabilityID': vuln.get('VulnerabilityID', ''),
                    'Severity': vuln.get('Severity', 'UNKNOWN'),
                    'Description': vuln.get('Description', ''),
                    'AffectedImageCount': len(VulnerabilityIndexService.get_affected_images(
                        vuln.get('VulnerabilityID', ''), scans
                    ))
                }
                for vuln in all_vulns
            ]
        
        # Cache for 5 minutes
        CacheService.set(cache_key, results, ttl=300)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/api/vulnerabilities/{cve_id}/affected-images")
async def get_affected_images_by_cve(cve_id: str):
    """
    Get all images affected by a specific CVE (from active scans only).
    """
    # Try to get from cache
    cached = CacheService.get(f"vulnerability:{cve_id}:affected")
    if cached:
        return cached
    
    db = SessionLocal()
    try:
        scans = db.query(ScanResultDB).order_by(ScanResultDB.scan_time.desc()).all()
        affected = VulnerabilityIndexService.get_affected_images(cve_id, scans)
        
        # Cache for 5 minutes
        CacheService.set(f"vulnerability:{cve_id}:affected", affected, ttl=300)
        
        return affected
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
