<#
  Launches <exe> [args...] with a Windows SAFER "normal user" token, which has
  the Administrators group disabled even when this script itself is running
  as an elevated/administrator account.

  PostgreSQL's postmaster refuses to start when its process token has the
  Administrators group enabled (pgwin32_is_admin check, hardcoded, no config
  override). This lets embedded Postgres start regardless of which Windows
  account launched the app.

  Usage: priv-drop-launcher.ps1 <exe> [args...]
  Exits with the launched process's exit code once it terminates.
#>

$ErrorActionPreference = 'Stop'

Add-Type -Language CSharp -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class PrivDrop {
    [DllImport("advapi32.dll", SetLastError = true)]
    static extern bool SaferCreateLevel(uint dwScopeId, uint dwLevelId, uint OpenFlags, out IntPtr LevelHandle, IntPtr lpReserved);

    [DllImport("advapi32.dll", SetLastError = true)]
    static extern bool SaferComputeTokenFromLevel(IntPtr LevelHandle, IntPtr InAccessToken, out IntPtr OutAccessToken, uint dwFlags, IntPtr lpReserved);

    [DllImport("advapi32.dll", SetLastError = true)]
    static extern bool SaferCloseLevel(IntPtr hLevelHandle);

    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool CreateProcessAsUser(
        IntPtr hToken,
        string lpApplicationName,
        string lpCommandLine,
        IntPtr lpProcessAttributes,
        IntPtr lpThreadAttributes,
        bool bInheritHandles,
        uint dwCreationFlags,
        IntPtr lpEnvironment,
        string lpCurrentDirectory,
        ref STARTUPINFO lpStartupInfo,
        out PROCESS_INFORMATION lpProcessInformation);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool CloseHandle(IntPtr hObject);

    [StructLayout(LayoutKind.Sequential)]
    public struct STARTUPINFO {
        public Int32 cb;
        public string lpReserved;
        public string lpDesktop;
        public string lpTitle;
        public Int32 dwX;
        public Int32 dwY;
        public Int32 dwXSize;
        public Int32 dwYSize;
        public Int32 dwXCountChars;
        public Int32 dwYCountChars;
        public Int32 dwFillAttribute;
        public Int32 dwFlags;
        public Int16 wShowWindow;
        public Int16 cbReserved2;
        public IntPtr lpReserved2;
        public IntPtr hStdInput;
        public IntPtr hStdOutput;
        public IntPtr hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_INFORMATION {
        public IntPtr hProcess;
        public IntPtr hThread;
        public int dwProcessId;
        public int dwThreadId;
    }

    const uint SAFER_SCOPEID_USER = 1;
    const uint SAFER_LEVELID_NORMALUSER = 0x20000;
    const uint SAFER_LEVEL_OPEN = 1;

    /// <summary>
    /// Launches exe with a restricted (non-admin) token derived from the
    /// current process's token. Returns the new process id.
    /// </summary>
    public static int Launch(string exe, string cmdLine, string cwd) {
        IntPtr level;
        if (!SaferCreateLevel(SAFER_SCOPEID_USER, SAFER_LEVELID_NORMALUSER, SAFER_LEVEL_OPEN, out level, IntPtr.Zero))
            throw new Exception("SaferCreateLevel failed: " + Marshal.GetLastWin32Error());

        IntPtr restrictedToken;
        bool computed = SaferComputeTokenFromLevel(level, IntPtr.Zero, out restrictedToken, 0, IntPtr.Zero);
        int computeErr = Marshal.GetLastWin32Error();
        SaferCloseLevel(level);
        if (!computed)
            throw new Exception("SaferComputeTokenFromLevel failed: " + computeErr);

        STARTUPINFO si = new STARTUPINFO();
        si.cb = Marshal.SizeOf(typeof(STARTUPINFO));
        PROCESS_INFORMATION pi;

        bool ok = CreateProcessAsUser(restrictedToken, null, cmdLine, IntPtr.Zero, IntPtr.Zero, true, 0, IntPtr.Zero, cwd, ref si, out pi);
        int createErr = Marshal.GetLastWin32Error();
        CloseHandle(restrictedToken);
        if (!ok)
            throw new Exception("CreateProcessAsUser failed: " + createErr);

        CloseHandle(pi.hThread);
        // Intentionally not closing pi.hProcess: the caller waits on the pid via
        // System.Diagnostics.Process, which opens its own handle.
        return pi.dwProcessId;
    }
}
'@

if ($args.Count -lt 1) {
    Write-Error "usage: priv-drop-launcher.ps1 <exe> [args...]"
    exit 2
}

$exe = $args[0]
$exeArgs = @()
if ($args.Count -gt 1) { $exeArgs = $args[1..($args.Count - 1)] }

$quotedArgs = $exeArgs | ForEach-Object { '"' + ($_ -replace '"', '\"') + '"' }
$cmdLine = (@('"' + $exe + '"') + $quotedArgs) -join ' '

$childPid = [PrivDrop]::Launch($exe, $cmdLine, (Get-Location).Path)

try {
    $proc = [System.Diagnostics.Process]::GetProcessById($childPid)
    $proc.WaitForExit()
    exit $proc.ExitCode
} catch {
    exit 0
}
