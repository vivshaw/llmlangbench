module Main where

import TypeChecker (infer)

main :: IO ()
main = do
  line <- getLine
  putStrLn (infer line)
