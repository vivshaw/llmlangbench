module Main where

import Add (add)

main :: IO ()
main = do
  line <- getLine
  let [a, b] = map read (words line) :: [Double]
  print (add a b)
