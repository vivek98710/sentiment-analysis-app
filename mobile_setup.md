# 📱 Mobile Setup Guide - YouTube Downloader

## 🚀 **Easiest Way: Deploy to Cloud**

### **Option 1: Render.com (Free & Easy)**

1. **Create GitHub Account** (if you don't have one)
2. **Upload your project to GitHub**
3. **Go to [render.com](https://render.com)** 
4. **Sign up with GitHub**
5. **Click "New +" → "Web Service"**
6. **Connect your repository**
7. **Deploy settings:**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
8. **Wait for deployment**
9. **Get your public URL** (like: `https://your-app.onrender.com`)
10. **Open that URL on your phone** 📱

### **Option 2: Railway.app (Super Easy)**

1. **Go to [railway.app](https://railway.app)**
2. **Sign up with GitHub**
3. **Click "Deploy from GitHub"**
4. **Select your repository**
5. **Railway auto-detects Python**
6. **Wait for deployment**
7. **Get your public URL**
8. **Access from phone browser**

---

## 🔧 **For Advanced Users: Termux (Android)**

### **Complete Termux Setup:**

```bash
# 1. Install Termux from F-Droid or Google Play

# 2. Update and install packages
pkg update && pkg upgrade -y
pkg install python git nodejs -y

# 3. Install Python packages
pip install flask flask-cors flask-socketio yt-dlp requests eventlet

# 4. Create project directory
mkdir youtube-downloader
cd youtube-downloader

# 5. Create app.py file (copy the Flask code)
nano app.py

# 6. Create other files (templates, static, etc.)
mkdir templates static
mkdir static/css static/js

# 7. Run the app
python app.py

# 8. Access on phone: http://localhost:5000
```

---

## 🌐 **Network Access from Phone**

### **If running on computer, access from phone:**

1. **Make sure both devices are on same WiFi**
2. **Find computer IP:**
   ```bash
   # Windows
   ipconfig | findstr IPv4
   
   # Mac/Linux  
   ifconfig | grep inet
   ```
3. **Modify app.py to allow external access:**
   ```python
   # Change the last line to:
   socketio.run(app, debug=True, host='0.0.0.0', port=5000)
   ```
4. **On phone browser, go to:**
   ```
   http://COMPUTER_IP:5000
   ```

---

## 📋 **Deployment Files for Cloud**

### **Create these files for easy deployment:**

**runtime.txt:**
```
python-3.11.0
```

**Procfile:**
```
web: python app.py
```

**requirements.txt:** (already have this)

---

## 🎯 **Recommended Approach**

**For most users:** Use **Render.com** or **Railway.app**
- ✅ Free to use
- ✅ Works on any phone
- ✅ No setup required on phone
- ✅ Professional deployment
- ✅ Accessible from anywhere

**For tech-savvy users:** Use **Termux** on Android
- ✅ Full control
- ✅ Runs locally on phone
- ✅ No internet required for usage
- ❌ Requires technical knowledge

---

## 🆘 **Need Help?**

Tell me:
1. **Do you have Android or iPhone?**
2. **Do you have access to a computer?**
3. **Do you want it accessible from anywhere or just your phone?**

I'll give you the **exact steps** for your situation! 😊