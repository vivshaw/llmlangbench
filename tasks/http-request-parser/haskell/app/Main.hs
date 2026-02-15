module Main where

import Parser (parseRequest)

main :: IO ()
main = do
  contents <- getContents
  putStrLn (parseRequest contents)
