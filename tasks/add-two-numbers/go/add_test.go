package add

import (
	"math"
	"testing"
)

func TestAddsTwoPositiveNumbers(t *testing.T) {
	if Add(1, 2) != 3 {
		t.Error("expected Add(1, 2) to equal 3")
	}
}

func TestAddsNegativeNumbers(t *testing.T) {
	if Add(-1, -2) != -3 {
		t.Error("expected Add(-1, -2) to equal -3")
	}
}

func TestAddsANegativeAndAPositiveNumber(t *testing.T) {
	if Add(-1, 1) != 0 {
		t.Error("expected Add(-1, 1) to equal 0")
	}
}

func TestAddsZeros(t *testing.T) {
	if Add(0, 0) != 0 {
		t.Error("expected Add(0, 0) to equal 0")
	}
}

func TestAddsFloatingPointNumbers(t *testing.T) {
	result := Add(0.1, 0.2)
	if math.Abs(result-0.3) > 1e-10 {
		t.Errorf("expected Add(0.1, 0.2) to be close to 0.3, got %f", result)
	}
}
