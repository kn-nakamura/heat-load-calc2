from app.services.validation import validate_project
from app.models.schemas import Project, Room, InternalLoad, ValidationLevel


def test_validate_project_with_empty_ids():
    """Test that empty IDs are not flagged as duplicates"""
    project = Project(
        id="test-project",
        name="Test Project",
        region="東京",
        rooms=[
            Room(id="room1", name="Room 1", area_m2=20),
            Room(id="", name="Empty Room", area_m2=0),  # Empty ID should be filtered
            Room(id="", name="Another Empty", area_m2=0),  # Multiple empty IDs
            Room(id="room2", name="Room 2", area_m2=30),
        ]
    )

    issues = validate_project(project)

    # Should have no duplicate ID errors for empty IDs
    duplicate_errors = [i for i in issues if i.code == "duplicate_id"]
    assert len(duplicate_errors) == 0, "Empty IDs should not be flagged as duplicates"


def test_validate_project_with_actual_duplicates():
    """Test that actual duplicate IDs are detected"""
    project = Project(
        id="test-project",
        name="Test Project",
        region="東京",
        rooms=[
            Room(id="room1", name="Room 1", area_m2=20),
            Room(id="room1", name="Duplicate Room", area_m2=30),
            Room(id="room2", name="Room 2", area_m2=30),
        ]
    )

    issues = validate_project(project)

    # Should detect duplicate room1
    duplicate_errors = [i for i in issues if i.code == "duplicate_id"]
    assert len(duplicate_errors) == 1, "Should detect duplicate IDs"
    assert duplicate_errors[0].entity == "rooms"
    assert "room1" in duplicate_errors[0].message


def test_validate_project_with_internal_load_duplicates():
    """Test duplicate detection for internal loads"""
    project = Project(
        id="test-project",
        name="Test Project",
        region="東京",
        rooms=[Room(id="room1", name="Room 1", area_m2=20)],
        internal_loads=[
            InternalLoad(id="load1", room_id="room1", kind="lighting", sensible_w=100),
            InternalLoad(id="load1", room_id="room1", kind="occupancy", sensible_w=200),
            InternalLoad(id="", room_id="room1", kind="other", sensible_w=0),  # Empty ID
        ]
    )

    issues = validate_project(project)

    # Should detect duplicate load1, but not the empty ID
    duplicate_errors = [i for i in issues if i.code == "duplicate_id"]
    assert len(duplicate_errors) == 1, "Should detect one duplicate ID"
    assert duplicate_errors[0].entity == "internal_loads"
    assert "load1" in duplicate_errors[0].message


def test_validate_project_with_unique_ids():
    """Test that unique IDs don't trigger errors"""
    project = Project(
        id="test-project",
        name="Test Project",
        region="東京",
        rooms=[
            Room(id="room1", name="Room 1", area_m2=20),
            Room(id="room2", name="Room 2", area_m2=30),
            Room(id="room3", name="Room 3", area_m2=25),
        ]
    )

    issues = validate_project(project)

    # Should have no duplicate ID errors
    duplicate_errors = [i for i in issues if i.code == "duplicate_id"]
    assert len(duplicate_errors) == 0, "Unique IDs should not trigger errors"
