import json
import logging
from flask import Blueprint, jsonify, request, send_file
import io

from services.sync_service import SyncService

logger = logging.getLogger(__name__)
sync_bp = Blueprint("sync", __name__)


@sync_bp.route("/api/sync/export", methods=["GET"])
def export_sync():
    """
    Exports all study metrics, lesson progress, notes, and calendar events as JSON.
    Query param `download=true` will return as an attachment file for browser download.
    """
    try:
        data = SyncService.export_data()
        as_download = request.args.get("download", "false").lower() == "true"
        if as_download:
            json_bytes = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
            from datetime import datetime
            filename = f"receitas-sync-{datetime.now().strftime('%Y-%m-%d-%H%M')}.json"
            return send_file(
                io.BytesIO(json_bytes),
                mimetype="application/json",
                as_attachment=True,
                download_name=filename,
            )
        return jsonify(data)
    except Exception as e:
        logger.exception("Erro ao exportar dados de sincronização")
        return jsonify({"error": f"Erro ao exportar: {str(e)}"}), 500


@sync_bp.route("/api/sync/import", methods=["POST"])
def import_sync():
    """
    Imports metrics from JSON body or from uploaded .json file.
    Merges without data loss.
    """
    try:
        payload = None
        # Handle file upload if present
        if "file" in request.files:
            uploaded_file = request.files["file"]
            if uploaded_file and uploaded_file.filename.endswith(".json"):
                file_content = uploaded_file.read().decode("utf-8")
                payload = json.loads(file_content)
            else:
                return jsonify({"error": "O arquivo deve ser um .json válido"}), 400
        else:
            payload = request.get_json(silent=True)

        if not payload or not isinstance(payload, dict):
            return jsonify({"error": "Conteúdo JSON inválido ou vazio"}), 400

        result = SyncService.import_data(payload)
        return jsonify(result)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.exception("Erro ao importar dados de sincronização")
        return jsonify({"error": f"Erro ao importar: {str(e)}"}), 500


@sync_bp.route("/api/sync/peer", methods=["POST"])
def peer_sync():
    """
    Synchronizes directly with another instance running on the network.
    Example payload: { "remote_url": "192.168.1.50:9823" }
    """
    try:
        body = request.get_json() or {}
        remote_url = body.get("remote_url", "").strip()
        if not remote_url:
            return jsonify({"error": "Informe o endereço do notebook (ex: 192.168.1.50:9823)"}), 400

        result = SyncService.peer_sync(remote_url)
        return jsonify(result)
    except ConnectionError as ce:
        return jsonify({"error": str(ce)}), 502
    except Exception as e:
        logger.exception("Erro na sincronização de rede")
        return jsonify({"error": f"Falha na sincronização: {str(e)}"}), 500
