from app.domain.rounding import round_half_up


def test_round_half_up_zero_digits():
    assert round_half_up(1.5, 0) == 2.0
    assert round_half_up(2.5, 0) == 3.0
    assert round_half_up(-1.5, 0) == -2.0


def test_round_half_up_decimal_digits():
    assert round_half_up(1.234, 2) == 1.23
    assert round_half_up(1.235, 2) == 1.24
