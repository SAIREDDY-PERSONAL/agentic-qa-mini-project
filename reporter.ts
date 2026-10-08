import fs from "fs";

export interface TestResultMetric {
  testId: string;
  prompt: string;
  score: number;
  isGrounded: boolean;
  passed: boolean;
}

export class EvalSummaryReporter {
  private metrics: TestResultMetric[] = [];

  record(metric: TestResultMetric) {
    this.metrics.push(metric);
  }

  generateReport() {
    const total = this.metrics.length;
    const passed = this.metrics.filter(m => m.passed).length;
    const avgScore = this.metrics.reduce((acc, m) => acc + m.score, 0) / (total || 1);

    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: total,
      passRate: `${((passed / total) * 100).toFixed(1)}%`,
      averageJudgeScore: avgScore.toFixed(2),
      results: this.metrics
    };

    fs.writeFileSync("eval_report_summary.json", JSON.stringify(summary, null, 2));
    console.log("\n📊 Evaluation Summary Report Generated: eval_report_summary.json");
  }
}