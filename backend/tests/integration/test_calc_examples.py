import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _load_fixture(name: str) -> dict:
    path = Path(__file__).resolve().parents[1] / "fixtures" / name
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def test_example1_major_cells_match():
    payload = _load_fixture("project_example1.json")
    expected = _load_fixture("expected_example1_major_cells.json")

    res = client.post("/v1/calc/run", json={"project": payload})
    assert res.status_code == 200
    data = res.json()
    for key, val in expected.items():
        assert data["major_cells"].get(key) == val


def test_example2_major_cells_match():
    payload = _load_fixture("project_example2.json")
    expected = _load_fixture("expected_example2_major_cells.json")

    res = client.post("/v1/calc/run", json={"project": payload})
    assert res.status_code == 200
    data = res.json()
    for key, val in expected.items():
        assert data["major_cells"].get(key) == val
