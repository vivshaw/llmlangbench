import Test.Hspec
import Add

main :: IO ()
main = hspec $ do
  describe "add" $ do
    it "adds two positive numbers" $
      add 1 2 `shouldBe` (3 :: Double)

    it "adds negative numbers" $
      add (-1) (-2) `shouldBe` (-3 :: Double)

    it "adds a negative and a positive number" $
      add (-1) 1 `shouldBe` (0 :: Double)

    it "adds zeros" $
      add 0 0 `shouldBe` (0 :: Double)

    it "adds floating point numbers" $
      add 0.1 0.2 `shouldSatisfy` (\x -> abs (x - 0.3) < 1e-10)
