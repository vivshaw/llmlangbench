import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int[][] grid = new int[9][9];

        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                grid[i][j] = scanner.nextInt();
            }
        }

        int[][] result = Solver.solve(grid);

        for (int[] row : result) {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < 9; j++) {
                if (j > 0) sb.append(" ");
                sb.append(row[j]);
            }
            System.out.println(sb.toString());
        }
    }
}
