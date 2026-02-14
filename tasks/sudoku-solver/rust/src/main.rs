use sudoku_solver::solve;
use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    let mut grid = [[0u8; 9]; 9];

    for (i, line) in stdin.lock().lines().enumerate() {
        let line = line.unwrap();
        for (j, val) in line.trim().split_whitespace().enumerate() {
            grid[i][j] = val.parse().unwrap();
        }
    }

    let result = solve(grid);

    for row in &result {
        let parts: Vec<String> = row.iter().map(|&x| x.to_string()).collect();
        println!("{}", parts.join(" "));
    }
}
