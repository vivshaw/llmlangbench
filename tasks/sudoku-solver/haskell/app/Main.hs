module Main where

import Solver (solve)

main :: IO ()
main = do
  contents <- getContents
  let grid = map (map read . words) (lines contents) :: [[Int]]
  let result = solve grid
  mapM_ (putStrLn . unwords . map show) result
