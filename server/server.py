from flask import Flask, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder="../public", static_url_path="")

UPLOAD_FOLDER = os.path.join(app.static_folder, "images")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

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


@app.route("/upload-image", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return "No file part", 400

    file = request.files["image"]
    if file.filename == "":
        return "No selected file", 400

    filename = file.filename
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(save_path)
    return f"Uploaded as /images/{filename}", 200


@app.route("/images")
def list_images():
    image_dir = app.config["UPLOAD_FOLDER"]
    try:
        filenames = [
            f
            for f in os.listdir(image_dir)
            if os.path.isfile(os.path.join(image_dir, f))
        ]
        return jsonify(filenames)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/delete-image/<filename>", methods=["DELETE"])
def delete_image(filename):
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({"message": "Image deleted"}), 200
    return jsonify({"error": "File not found"}), 404


# Serve admin.html for any unknown routes (like captive portal redirects)
@app.errorhandler(404)
def redirect_to_admin(e):
    return send_from_directory(app.static_folder, "admin.html"), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port, host="0.0.0.0")
