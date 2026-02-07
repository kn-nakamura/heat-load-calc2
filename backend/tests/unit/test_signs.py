from app.domain.signs import split_cooling_heating


def test_split_cooling_heating_positive():
    c, h = split_cooling_heating(12.5)
    assert c == 12.5
    assert h == 0.0


def test_split_cooling_heating_negative():
    c, h = split_cooling_heating(-8.0)
    assert c == 0.0
    assert h == 8.0
