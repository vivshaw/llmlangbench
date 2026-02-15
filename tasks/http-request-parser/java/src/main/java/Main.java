import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        scanner.useDelimiter("\\z");
        String input = scanner.hasNext() ? scanner.next() : "";
        System.out.println(Parser.parseRequest(input));
    }
}
