"""
Lambda handler for AWS Lambda using Mangum ASGI adapter
No Docker needed - just a ZIP file deployment
"""
from mangum import Mangum
from main import app

# Convert FastAPI app to Lambda handler
handler = Mangum(app, lifespan="off")
