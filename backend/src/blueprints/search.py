from flask import Blueprint, jsonify, request

from services.search_service import SearchService

search_bp = Blueprint("search", __name__)


@search_bp.route("/api/search", methods=["GET"])
def search():
    query = request.args.get("q", "")
    limit = request.args.get("limit", 20, type=int)
    results = SearchService.search(query=query, limit=limit)
    return jsonify(results)
