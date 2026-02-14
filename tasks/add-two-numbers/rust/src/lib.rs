// Implement the add function here

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_two_positive_numbers() {
        assert_eq!(add(1.0, 2.0), 3.0);
    }

    #[test]
    fn adds_negative_numbers() {
        assert_eq!(add(-1.0, -2.0), -3.0);
    }

    #[test]
    fn adds_a_negative_and_a_positive_number() {
        assert_eq!(add(-1.0, 1.0), 0.0);
    }

    #[test]
    fn adds_zeros() {
        assert_eq!(add(0.0, 0.0), 0.0);
    }

    #[test]
    fn adds_floating_point_numbers() {
        let result = add(0.1, 0.2);
        assert!((result - 0.3).abs() < 1e-10);
    }
}
