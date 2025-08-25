try:
    print("Testing Flask import...")
    from flask import Flask
    print("✅ Flask imported successfully!")
    
    app = Flask(__name__)
    print("✅ Flask app created!")
    
    @app.route('/')
    def hello():
        return "Hello, World!"
    
    print("✅ Route defined!")
    print("Starting server...")
    app.run(debug=True, port=5000)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
