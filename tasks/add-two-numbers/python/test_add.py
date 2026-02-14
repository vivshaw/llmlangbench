import pytest
from add import add


def test_adds_two_positive_numbers():
    assert add(1, 2) == 3


def test_adds_negative_numbers():
    assert add(-1, -2) == -3


def test_adds_a_negative_and_a_positive_number():
    assert add(-1, 1) == 0


def test_adds_zeros():
    assert add(0, 0) == 0


def test_adds_floating_point_numbers():
    assert add(0.1, 0.2) == pytest.approx(0.3)
