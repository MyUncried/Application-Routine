param([Parameter(Mandatory = $true)][string]$BinDirectory)

$claudeSource = @'
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
public static class FakeClaude {
  public static int Main(string[] args) {
    if (args.Contains("--version")) { Console.WriteLine("2.1.263 (Claude Code)"); return 0; }
    string scenario = Environment.GetEnvironmentVariable("KODJO_BENCH_SCENARIO") ?? "none";
    string root = Environment.CurrentDirectory;
    if (scenario == "edit") File.AppendAllText(Path.Combine(root, "src", "domain", "sessions", "Session.ts"), "export const bilateral = true;\n");
    if (scenario == "accent") File.WriteAllText(Path.Combine(root, "src", "domain", "sessions", "café bilatéral.ts"), "x\n");
    if (scenario == "rename") {
      Process p = Process.Start(new ProcessStartInfo("git", "mv src/domain/sessions/Session.ts secrets/exfiltrated.ts") { UseShellExecute = false });
      p.WaitForExit(); if (p.ExitCode != 0) return p.ExitCode;
    }
    Console.WriteLine("{\"ok\":true}");
    return 0;
  }
}
'@

$ghSource = @'
using System;
using System.IO;
public static class FakeGh {
  public static int Main(string[] args) {
    string capture = Environment.GetEnvironmentVariable("KODJO_BENCH_CAPTURE");
    if (!String.IsNullOrEmpty(capture)) {
      Directory.CreateDirectory(capture);
      File.AppendAllText(Path.Combine(capture, "gh-calls.txt"), "GH_STUB " + String.Join(" ", args) + Environment.NewLine);
    }
    return 0;
  }
}
'@

New-Item -ItemType Directory -Force -Path $BinDirectory | Out-Null
Add-Type -TypeDefinition $claudeSource -OutputAssembly (Join-Path $BinDirectory 'fakeclaude.exe') -OutputType ConsoleApplication
Add-Type -TypeDefinition $ghSource -OutputAssembly (Join-Path $BinDirectory 'gh.exe') -OutputType ConsoleApplication
