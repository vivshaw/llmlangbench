module Main where

import Simulator (simulate)

main :: IO ()
main = do
  contents <- getContents
  putStrLn (simulate contents)
