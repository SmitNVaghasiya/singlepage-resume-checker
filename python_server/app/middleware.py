import time
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from loguru import logger
from app.models import ErrorResponse
from app.config import settings


class RateLimiter:
    """In-memory rate limiter with daily limits"""
    
    def __init__(self):
        self.requests: Dict[str, list] = {}  # IP -> list of timestamps
        self.daily_limits: Dict[str, int] = {}  # IP -> daily request count
        self.max_requests_per_day = settings.max_requests_per_day  # Use config setting
        self.cleanup_interval = 3600  # Cleanup every hour
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        # Check for forwarded headers first
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Check for real IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to client host
        return request.client.host if request.client else "unknown"
    
    def _cleanup_old_requests(self):
        """Clean up old request timestamps"""
        current_time = time.time()
        cutoff_time = current_time - 86400  # 24 hours ago
        
        for ip in list(self.requests.keys()):
            self.requests[ip] = [
                timestamp for timestamp in self.requests[ip] 
                if timestamp > cutoff_time
            ]
            
            # Remove IP if no recent requests
            if not self.requests[ip]:
                del self.requests[ip]
                if ip in self.daily_limits:
                    del self.daily_limits[ip]
    
    def _get_daily_count(self, ip: str) -> int:
        """Get daily request count for IP"""
        current_time = time.time()
        day_start = current_time - (current_time % 86400)  # Start of current day
        
        # Count requests from today
        today_requests = [
            timestamp for timestamp in self.requests.get(ip, [])
            if timestamp >= day_start
        ]
        
        return len(today_requests)
    
    def check_rate_limit(self, request: Request) -> Tuple[bool, Optional[str]]:
        """
        Check if request is within rate limits
        
        Returns:
            (allowed, error_message)
        """
        client_ip = self._get_client_ip(request)
        
        # Periodic cleanup
        if time.time() % self.cleanup_interval < 1:
            self._cleanup_old_requests()
        
        # Initialize request list for this IP
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        
        # Check daily limit
        daily_count = self._get_daily_count(client_ip)
        
        if daily_count >= self.max_requests_per_day:
            return False, f"Daily limit exceeded. Maximum {self.max_requests_per_day} requests per day allowed."
        
        # Add current request
        self.requests[client_ip].append(time.time())
        
        return True, None


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    
    # Skip rate limiting for health checks and documentation
    if request.url.path in ["/", "/docs", "/redoc", "/openapi.json", "/api/v1/health", "/api/v1/health/simple"]:
        return await call_next(request)
    
    # Check rate limit
    allowed, error_message = rate_limiter.check_rate_limit(request)
    
    if not allowed:
        logger.warning(f"Rate limit exceeded for IP: {request.client.host}")
        return JSONResponse(
            status_code=429,
            content=ErrorResponse(
                error="rate_limit_exceeded",
                message=error_message,
                details="Please try again tomorrow or contact support for increased limits."
            ).dict()
        )
    
    # Add rate limit headers to response
    response = await call_next(request)
    
    # Add rate limit headers
    client_ip = rate_limiter._get_client_ip(request)
    daily_count = rate_limiter._get_daily_count(client_ip)
    
    response.headers["X-RateLimit-Limit"] = str(rate_limiter.max_requests_per_day)
    response.headers["X-RateLimit-Remaining"] = str(rate_limiter.max_requests_per_day - daily_count)
    response.headers["X-RateLimit-Reset"] = str(int(time.time() + 86400 - (time.time() % 86400)))
    
    return response 