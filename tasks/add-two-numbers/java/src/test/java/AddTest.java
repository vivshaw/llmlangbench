import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AddTest {
    @Test
    void addsTwoPositiveNumbers() {
        assertEquals(3.0, Add.add(1, 2));
    }

    @Test
    void addsNegativeNumbers() {
        assertEquals(-3.0, Add.add(-1, -2));
    }

    @Test
    void addsANegativeAndAPositiveNumber() {
        assertEquals(0.0, Add.add(-1, 1));
    }

    @Test
    void addsZeros() {
        assertEquals(0.0, Add.add(0, 0));
    }

    @Test
    void addsFloatingPointNumbers() {
        assertEquals(0.3, Add.add(0.1, 0.2), 1e-10);
    }
}
