use regex_matcher::regex_match;
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut parts = input.splitn(2, '\n');
    let pattern = parts.next().unwrap_or("");
    let text = parts.next().unwrap_or("");
    println!("{}", if regex_match(pattern, text) { "true" } else { "false" });
}
