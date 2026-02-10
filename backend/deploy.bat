@echo off
REM Deployment script for Lambda ZIP file

echo Creating deployment package...

REM Create a temporary directory
if exist temp_lambda rmdir /s /q temp_lambda
mkdir temp_lambda

REM Copy source files
copy main.py temp_lambda\
copy lambda_handler.py temp_lambda\

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt -t temp_lambda\

REM Remove unnecessary files to reduce size
cd temp_lambda
rmdir /s /q pip
rmdir /s /q __pycache__
del /q *.dist-info\*.txt
cd ..

REM Create ZIP file
echo Creating ZIP archive...
if exist gemini-summarizer.zip del gemini-summarizer.zip
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('temp_lambda', 'gemini-summarizer.zip')"

echo.
echo ZIP file created: gemini-summarizer.zip
echo Ready to upload to Lambda!
echo.
echo Next steps:
echo 1. Go to AWS Lambda Console
echo 2. Create a new function with Python 3.11 runtime
echo 3. Upload this gemini-summarizer.zip file
echo 4. Set Handler to: lambda_handler.handler
echo 5. Set Timeout to 5 minutes
echo 6. Set Memory to 512 MB or higher
echo 7. Create Function URL with RESPONSE_STREAM enabled

pause
