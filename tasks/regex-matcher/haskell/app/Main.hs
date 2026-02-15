module Main where

import Matcher (match)

main :: IO ()
main = do
  contents <- getContents
  let (pattern, rest) = break (== '\n') contents
      text = if null rest then "" else tail rest
  putStrLn (if match pattern text then "true" else "false")
