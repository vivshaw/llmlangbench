module Main where

import Database (execute)

main :: IO ()
main = do
  input <- getContents
  putStrLn (execute input)
