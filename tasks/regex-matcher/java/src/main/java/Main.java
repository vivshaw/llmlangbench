import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        scanner.useDelimiter("\\z");
        String input = scanner.hasNext() ? scanner.next() : "";
        int idx = input.indexOf('\n');
        String pattern = idx >= 0 ? input.substring(0, idx) : input;
        String text = idx >= 0 ? input.substring(idx + 1) : "";
        System.out.println(Matcher.match(pattern, text) ? "true" : "false");
    }
}
