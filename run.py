#!/usr/bin/env python3
"""
YT Downloader Pro - Run Script
Simple script to install dependencies and start the application
"""

import sys
import subprocess
import os

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def start_application():
    """Start the Flask application"""
    print("🚀 Starting YT Downloader Pro...")
    print("📱 Open your browser and go to: http://localhost:5000")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Import and run the app
        from app import socketio, app
        socketio.run(app, debug=False, host='0.0.0.0', port=5000)
    except ImportError as e:
        print(f"❌ Failed to import app: {e}")
        print("💡 Make sure all dependencies are installed correctly")
        return False
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
        return True
    except Exception as e:
        print(f"❌ Error starting application: {e}")
        return False

def main():
    """Main function"""
    print("🎬 YT Downloader Pro")
    print("=" * 30)
    
    # Check if requirements.txt exists
    if not os.path.exists("requirements.txt"):
        print("❌ requirements.txt not found!")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Start the application
    start_application()

if __name__ == "__main__":
    main()