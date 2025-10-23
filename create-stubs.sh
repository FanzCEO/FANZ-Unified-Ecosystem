#!/bin/bash

# FanzDash
cat > stubs/fanzdash.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FanzDash - Admin Control Center</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; padding: 40px; }
        .logo { font-size: 3em; font-weight: bold; margin-bottom: 20px; }
        .status { background: rgba(0,255,0,0.2); padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎛️ FanzDash</div>
        <div class="status">✅ Admin Dashboard Active - Port 3030</div>
        <p>Central Admin Control Center</p>
    </div>
</body>
</html>
EOF

# API Gateway
cat > stubs/api-gateway.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FANZ API Gateway</title>
    <style>
        body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: linear-gradient(135deg, #0f3460 0%, #16537e 100%); color: #00ff00; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; padding: 40px; }
        .logo { font-size: 2.5em; font-weight: bold; margin-bottom: 20px; }
        .status { background: rgba(0,255,0,0.1); padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #00ff00; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">⚡ FANZ API Gateway</div>
        <div class="status">✅ API Gateway Online - Port 8090</div>
        <p>Central API Routing Hub</p>
    </div>
</body>
</html>
EOF

# BoyFanz
cat > stubs/boyfanz.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BoyFanz - Male Community Platform</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; padding: 40px; }
        .logo { font-size: 3em; font-weight: bold; margin-bottom: 20px; }
        .status { background: rgba(0,255,0,0.2); padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎯 BoyFanz</div>
        <div class="status">✅ Platform Online - Port 3001</div>
        <p>Premium Male Community Platform</p>
    </div>
</body>
</html>
EOF

# GirlFanz
cat > stubs/girlfanz.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GirlFanz - Female Community Platform</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); color: white; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; padding: 40px; }
        .logo { font-size: 3em; font-weight: bold; margin-bottom: 20px; }
        .status { background: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">💖 GirlFanz</div>
        <div class="status">✅ Platform Online - Port 3002</div>
        <p>Premium Female Community Platform</p>
    </div>
</body>
</html>
EOF

# PupFanz
cat > stubs/pupfanz.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PupFanz - Specialized Community Platform</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #8b5a3c 0%, #a0522d 100%); color: white; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; padding: 40px; }
        .logo { font-size: 3em; font-weight: bold; margin-bottom: 20px; }
        .status { background: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🐾 PupFanz</div>
        <div class="status">✅ Platform Online - Port 3003</div>
        <p>Specialized Community Platform</p>
    </div>
</body>
</html>
EOF

echo "All stub files created successfully!"
EOF