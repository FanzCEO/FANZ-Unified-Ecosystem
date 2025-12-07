import os

class Config:
    SECRET_KEY = os.environ.get("SESSION_SECRET")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = "uploads"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    # VerifyMy API Configuration
    VERIFYMY_API_KEY = os.environ.get("VERIFYMY_API_KEY", "default_verifymy_key")
    VERIFYMY_BASE_URL = "https://api.verifymyaccount.com/v1"
    
    # Compliance settings
    REQUIRE_2257_COMPLIANCE = True
    DOCUMENT_RETENTION_DAYS = 2555  # 7 years
    
    # Security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Cluster configuration
    AVAILABLE_CLUSTERS = [
        'boyfanz', 'girlfanz', 'pupfanz', 'tranzfanz', 
        'taboofanz', 'daddyfanz', 'allmyfanz', 'recoveryfanz',
        'fanztube', 'fanzvarsity', 'fanzwork', 'fanzfluence',
        'fanzvip', 'fanzai'
    ]
    
    # Payment gateway settings (placeholders for future implementation)
    PAYMENT_GATEWAYS = {
        'paxum': {'enabled': False, 'api_key': os.environ.get("PAXUM_API_KEY", "")},
        'ccbill': {'enabled': False, 'api_key': os.environ.get("CCBILL_API_KEY", "")},
        'nmi': {'enabled': False, 'api_key': os.environ.get("NMI_API_KEY", "")},
        'host_merchant': {'enabled': False, 'api_key': os.environ.get("HOST_MERCHANT_API_KEY", "")},
        'payoneer': {'enabled': False, 'api_key': os.environ.get("PAYONEER_API_KEY", "")}
    }
