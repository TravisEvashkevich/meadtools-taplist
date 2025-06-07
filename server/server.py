from flask import Flask, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="../public", static_url_path="")

TAPLIST_PATH = os.path.join(app.static_folder, "taplist.json")


@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/admin")
def serve_admin():
    return send_from_directory(app.static_folder, "admin.html")


@app.route("/taplist.json")
def serve_taplist():
    return send_from_directory(app.static_folder, "taplist.json")


@app.route("/update-taplist", methods=["POST"])
def update_taplist():
    try:
        data = request.get_json()
        with open(TAPLIST_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return jsonify({"message": "Taplist updated successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
