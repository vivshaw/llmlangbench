use add_two_numbers::add;
use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let nums: Vec<f64> = input.trim().split_whitespace().map(|s| s.parse().unwrap()).collect();
    println!("{}", add(nums[0], nums[1]));
}
