
from fastapi import APIRouter, Request, Depends, HTTPException
from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.responses import RedirectResponse
from backend.auth.config import settings
from backend.auth.database import create_or_update_user
from backend.auth.utils import create_access_token

router = APIRouter()
oauth = OAuth()

# GitHub Configuration
oauth.register(
    name='github',
    client_id=settings.GITHUB_CLIENT_ID,
    client_secret=settings.GITHUB_CLIENT_SECRET,
    access_token_url='https://github.com/login/oauth/access_token',
    access_token_params=None,
    authorize_url='https://github.com/login/oauth/authorize',
    authorize_params=None,
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'}
)

@router.get("/login/{provider}")
async def login(request: Request, provider: str):
    if provider != 'github':
        raise HTTPException(status_code=400, detail="Only GitHub login is supported")
        
    if settings.BACKEND_URL:
        # Explicit override for production (avoids proxy/http/https matching issues)
        redirect_uri = f"{settings.BACKEND_URL}/api/auth/callback/{provider}"
    else:
        # Dynamic fallback for local development
        redirect_uri = request.url_for('auth_callback', provider=provider)
        
    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=404, detail="Provider not found")
    return await client.authorize_redirect(request, redirect_uri)

@router.get("/callback/{provider}")
async def auth_callback(request: Request, provider: str):
    if provider != 'github':
        raise HTTPException(status_code=400, detail="Only GitHub login is supported")

    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    try:
        token = await client.authorize_access_token(request)
    except OAuthError as error:
         # Redirect to frontend with error
         frontend_url = f"{settings.FRONTEND_URL}/auth/callback"
         return RedirectResponse(url=f"{frontend_url}?error={error.error}")
         
    user_info = {}
        
    if provider == 'github':
        resp = await client.get('user', token=token)
        profile = resp.json()
        
        # GitHub email might be private
        email = profile.get('email')
        if not email:
            emails_resp = await client.get('user/emails', token=token)
            emails = emails_resp.json()
            for e in emails:
                if e.get('primary') and e.get('verified'):
                    email = e['email']
                    break
        
        user_info = {
            'sub': str(profile['id']),
            'name': profile.get('name') or profile.get('login'),
            'email': email,
            'provider': 'github'
        }

    # Save to local DB
    user = create_or_update_user(user_info)
    
    # Create Local JWT
    access_token = create_access_token(data={
        "sub": str(user['id']), 
        "email": user['email'], 
        "provider": provider,
        "role": user['role'],
        "name": user['name']
    })
    
    # Redirect to Frontend with Token
    frontend_url = f"{settings.FRONTEND_URL}/auth/callback" 
    return RedirectResponse(url=f"{frontend_url}?token={access_token}")
